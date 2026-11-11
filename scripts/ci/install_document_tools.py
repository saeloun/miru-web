#!/usr/bin/env python3
"""Install the fixed document tools on a Linux GitHub Actions runner."""

import ctypes
import fcntl
import ipaddress
import json
import os
from pathlib import Path
import signal
import subprocess
import sys
import tempfile
import time
from contextlib import contextmanager
from urllib.request import HTTPRedirectHandler, Request, build_opener
import uuid

HOSTS = ("azure.archive.ubuntu.com", "archive.ubuntu.com", "security.ubuntu.com")
LIMIT = 65536
DNS_TIMEOUT = 10
HOSTS_LOCK_TIMEOUT = 5
APT_CLEANUP_TIMEOUT = 5
CANCEL_SIGNALS = {signal.SIGTERM, signal.SIGINT}
_cleanup_depth = 0
_pending_cancel = None
_cancelling = False
TOOL_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C.UTF-8",
            "DEBIAN_FRONTEND": "noninteractive"}
KNOWN_FAILURES = {
    "Invalid DNS address": "DNS_ADDRESS_INVALID",
    "Nonpublic DNS address": "DNS_ADDRESS_NONPUBLIC",
    "Duplicate DNS key": "DNS_DUPLICATE_KEY",
    "Invalid DNS name": "DNS_NAME_INVALID",
    "Invalid DNS response": "DNS_RESPONSE_INVALID",
    "DNS question or status refused": "DNS_QUESTION_REFUSED",
    "DNS answers missing": "DNS_ANSWERS_MISSING",
    "Malformed DNS answer": "DNS_ANSWER_INVALID",
    "Ambiguous DNS alias": "DNS_ALIAS_AMBIGUOUS",
    "No public IPv4 answer for this chain": "DNS_CHAIN_MISSING",
    "DNS alias cycle": "DNS_ALIAS_CYCLE",
    "DNS redirect refused": "DNS_REDIRECT_REFUSED",
    "Unapproved DNS host": "DNS_HOST_REFUSED",
    "Unexpected DNS content type": "DNS_CONTENT_TYPE_REFUSED",
    "Unapproved hosts mapping": "HOSTS_MAPPING_REFUSED",
    "Owned hosts block changed; refusing replacement": "HOSTS_BLOCK_CHANGED",
    "Short hosts write": "HOSTS_WRITE_SHORT",
    "Short hosts rollback": "HOSTS_ROLLBACK_SHORT",
    "Linux root GitHub-hosted runner required": "RUNNER_REFUSED",
}
FAILURE_CODES = set(KNOWN_FAILURES.values()) | {
    "DNS_DEADLINE", "DNS_CHILD_FAILED", "DNS_CHILD_OUTPUT", "DNS_CHILD_MODE_REFUSED",
    "HOSTS_LOCK_DEADLINE", "ARGUMENTS_REFUSED", "PROCESS_FAILED", "PROCESS_DEADLINE",
}


class ToolError(RuntimeError):
    pass


def safe_error_code(error):
    first = error.args[0] if error.args else None
    if type(first) is str:
        if isinstance(error, ToolError) and first in FAILURE_CODES:
            return first
        if first in KNOWN_FAILURES:
            return KNOWN_FAILURES[first]
    if isinstance(error, subprocess.TimeoutExpired):
        return "PROCESS_DEADLINE"
    if isinstance(error, subprocess.CalledProcessError):
        return "PROCESS_FAILED"
    return "UNEXPECTED_" + type(error).__name__


def report_error(error, phase="refused or failed"):
    print(f"Document tools {phase} [{safe_error_code(error)}]", file=sys.stderr)


def public_ipv4(value):
    if not isinstance(value, str):
        raise ValueError("Invalid DNS address")
    address = ipaddress.IPv4Address(value)
    if not address.is_global or address.is_multicast:
        raise ValueError("Nonpublic DNS address")
    return str(address)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ValueError("Duplicate DNS key")
        result[key] = value
    return result


def dns_name(value):
    if not isinstance(value, str):
        raise ValueError("Invalid DNS name")
    name = value.lower().removesuffix(".")
    if not name or name.endswith("."):
        raise ValueError("Invalid DNS name")
    return name


def parse_addresses(host, raw):
    if host not in HOSTS or len(raw) > LIMIT:
        raise ValueError("Invalid DNS response")
    data = json.loads(raw, object_pairs_hook=unique_object)
    question = data.get("Question") if isinstance(data, dict) else None
    valid_question = (isinstance(question, list) and len(question) == 1
                      and isinstance(question[0], dict) and type(question[0].get("type")) is int
                      and question[0]["type"] == 1 and dns_name(question[0].get("name")) == host)
    if (not isinstance(data, dict) or type(data.get("Status")) is not int
            or data["Status"] != 0 or data.get("TC") is not False or data.get("CD") is not False
            or not valid_question):
        raise ValueError("DNS question or status refused")
    answers = data.get("Answer")
    if not isinstance(answers, list) or not 1 <= len(answers) <= 64:
        raise ValueError("DNS answers missing")
    owners = {}
    for answer in answers:
        if (not isinstance(answer, dict) or type(answer.get("type")) is not int
                or answer["type"] not in (1, 5)):
            raise ValueError("Malformed DNS answer")
        owner = dns_name(answer.get("name"))
        value = public_ipv4(answer.get("data")) if answer["type"] == 1 else dns_name(answer.get("data"))
        owners.setdefault(owner, []).append((answer["type"], value))
    current, visited = host, set()
    while current not in visited:
        visited.add(current)
        records = owners.get(current, [])
        aliases = [value for kind, value in records if kind == 5]
        addresses = [value for kind, value in records if kind == 1]
        if aliases:
            if len(aliases) != 1 or addresses:
                raise ValueError("Ambiguous DNS alias")
            current = aliases[0]
        elif addresses:
            return list(dict.fromkeys(addresses))
        else:
            raise ValueError("No public IPv4 answer for this chain")
    raise ValueError("DNS alias cycle")


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise ValueError("DNS redirect refused")


def resolve_https_child(host):
    if host not in HOSTS:
        raise ValueError("Unapproved DNS host")
    request = Request("https://cloudflare-dns.com/dns-query?name=" + host + "&type=A",
                      headers={"Accept": "application/dns-json"})
    with build_opener(NoRedirect()).open(request, timeout=DNS_TIMEOUT) as response:
        if response.headers.get_content_type() != "application/dns-json":
            raise ValueError("Unexpected DNS content type")
        return parse_addresses(host, response.read(LIMIT + 1))


def resolve_https(host):
    if host not in HOSTS:
        raise ValueError("Unapproved DNS host")
    command = [sys.executable, "-I", str(Path(__file__).resolve()), "--resolve-host", host]
    try:
        result = subprocess.run(command, capture_output=True, timeout=DNS_TIMEOUT, env=TOOL_ENV)
    except subprocess.TimeoutExpired:
        raise ToolError("DNS_DEADLINE") from None
    if len(result.stdout) > 4096 or len(result.stderr) > 256:
        raise ToolError("DNS_CHILD_OUTPUT")
    if result.returncode:
        for code in FAILURE_CODES:
            if result.stderr == f"Document tools refused or failed [{code}]\n".encode():
                raise ToolError(code)
        raise ToolError("DNS_CHILD_FAILED")
    if result.stderr:
        raise ToolError("DNS_CHILD_OUTPUT")
    try:
        values = json.loads(result.stdout, object_pairs_hook=unique_object)
        if not isinstance(values, list) or not 1 <= len(values) <= 64:
            raise ValueError
        addresses = [public_ipv4(value) for value in values]
        if len(set(addresses)) != len(addresses):
            raise ValueError
        return addresses
    except (ValueError, TypeError):
        raise ToolError("DNS_CHILD_OUTPUT") from None


@contextmanager
def cancellation_handlers():
    global _cleanup_depth, _pending_cancel, _cancelling
    state = (_cleanup_depth, _pending_cancel, _cancelling)
    handlers = {sig: signal.getsignal(sig) for sig in CANCEL_SIGNALS}
    _cleanup_depth, _pending_cancel, _cancelling = 0, None, False
    try:
        for sig in CANCEL_SIGNALS:
            signal.signal(sig, interrupted)
        yield
    finally:
        for sig, handler in handlers.items():
            signal.signal(sig, handler)
        _cleanup_depth, _pending_cancel, _cancelling = state


@contextmanager
def defer_cancellation():
    global _cleanup_depth, _pending_cancel
    _cleanup_depth += 1
    try:
        yield
    finally:
        _cleanup_depth -= 1
        if not _cleanup_depth and _pending_cancel is not None:
            signum, _pending_cancel = _pending_cancel, None
            interrupted(signum, None)


def lock_hosts(output):
    deadline = time.monotonic() + HOSTS_LOCK_TIMEOUT
    while True:
        try:
            fcntl.flock(output, fcntl.LOCK_EX | fcntl.LOCK_NB)
            return
        except BlockingIOError:
            remaining = deadline - time.monotonic()
            if remaining <= 0:
                raise ToolError("HOSTS_LOCK_DEADLINE") from None
            time.sleep(min(0.05, remaining))


def lookup(host):
    try:
        # Check the user APT downloads as, rather than root's resolver access.
        return subprocess.run(["runuser", "-u", "_apt", "--", "getent", "ahostsv4", host], timeout=10,
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                              env=TOOL_ENV).returncode == 0
    except subprocess.TimeoutExpired:
        return False


def fallback_addresses():
    return {host: resolve_https(host) for host in HOSTS if not lookup(host)}


@contextmanager
def temporary_hosts(addresses, path=Path("/etc/hosts")):
    if not addresses:
        yield
        return
    marker = "miru-document-tools-" + uuid.uuid4().hex
    rows = []
    for host, values in addresses.items():
        if host not in HOSTS or not values:
            raise ValueError("Unapproved hosts mapping")
        rows.extend(f"{public_ipv4(value)} {host}\n" for value in values)
    block = (f"\n# BEGIN {marker}\n" + "".join(rows) + f"# END {marker}\n").encode()
    installed = False

    def edit_hosts(*, append):
        nonlocal installed
        with defer_cancellation():
            with path.open("r+b", buffering=0) as output:
                lock_hosts(output)
                current = output.read()
                if append:
                    updated = current + block
                else:
                    if current.count(block) != 1:
                        raise ValueError("Owned hosts block changed; refusing replacement")
                    updated = current.replace(block, b"", 1)
                output.seek(0)
                try:
                    if output.write(updated) != len(updated):
                        raise OSError("Short hosts write")
                    output.truncate()
                    output.flush()
                except BaseException:
                    # Restore this locked edit's input, including other writers' prior changes.
                    try:
                        output.seek(0)
                        if output.write(current) != len(current):
                            raise OSError("Short hosts rollback")
                        output.truncate()
                        output.flush()
                    except BaseException:
                        pass  # Preserve the original failure even if the filesystem cannot recover.
                    raise
                installed = append

    body_error = None
    try:
        edit_hosts(append=True)
        yield
    except BaseException as error:
        body_error = error
        raise
    finally:
        # Read the latest contents, not a saved original: retain other writers' edits.
        if installed:
            try:
                edit_hosts(append=False)
            except BaseException as error:
                if installed and isinstance(error, SystemExit) and _cancelling:
                    try:
                        edit_hosts(append=False)
                    except BaseException as cleanup_error:
                        report_error(cleanup_error, "hosts cleanup failed")
                elif installed or not isinstance(error, SystemExit):
                    report_error(error, "hosts cleanup failed")
                if body_error is None:
                    raise


def apt(arguments, timeout):
    command = ["apt-get", "-o", "Acquire::ForceIPv4=true",
               "-o", "Acquire::http::Timeout=15", "-o", "Acquire::https::Timeout=15",
               "-o", "APT::Update::Error-Mode=any", *arguments]
    process = None
    cleaned = False

    def cleanup_group():
        nonlocal cleaned
        with defer_cancellation():
            if process is not None:
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
                deadline = time.monotonic() + APT_CLEANUP_TIMEOUT
                try:
                    process.wait(timeout=APT_CLEANUP_TIMEOUT)
                except subprocess.TimeoutExpired:
                    pass
                while True:
                    process.poll()
                    try:
                        os.killpg(process.pid, 0)
                    except ProcessLookupError:
                        break
                    remaining = deadline - time.monotonic()
                    if remaining <= 0:
                        try:
                            os.killpg(process.pid, signal.SIGKILL)
                        except ProcessLookupError:
                            pass
                        break
                    time.sleep(min(0.05, remaining))
                process.wait(timeout=APT_CLEANUP_TIMEOUT)
            cleaned = True

    try:
        with defer_cancellation():
            process = subprocess.Popen(command, start_new_session=True, env=TOOL_ENV)
        code = process.wait(timeout=timeout)
        if code:
            raise subprocess.CalledProcessError(code, command)
    except BaseException:
        try:
            cleanup_group()
        except BaseException as error:
            if not cleaned and isinstance(error, SystemExit) and _cancelling:
                try:
                    cleanup_group()
                except BaseException as cleanup_error:
                    report_error(cleanup_error, "APT cleanup failed")
            elif not cleaned or not isinstance(error, SystemExit):
                report_error(error, "APT cleanup failed")
        raise


def interrupted(signum, _frame):
    global _pending_cancel, _cancelling
    if _cancelling:
        return
    if _cleanup_depth:
        _pending_cancel = _pending_cancel or signum
        return
    _cancelling = True
    raise SystemExit(128 + signum)


def main():
    if (sys.platform != "linux" or os.geteuid() != 0 or os.environ.get("RUNNER_OS") != "Linux"
            or os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted"
            or any(os.environ.get(key) != "true" for key in ("CI", "GITHUB_ACTIONS"))):
        raise RuntimeError("Linux root GitHub-hosted runner required")
    with cancellation_handlers():
        addresses = fallback_addresses()
        print(f"Document tools: temporary DNS fallback for {len(addresses)} fixed hosts", flush=True)
        with temporary_hosts(addresses):
            apt(["update"], 120)
            apt(["install", "--no-install-recommends", "-y", "poppler-utils", "qpdf", "libvips42t64"], 300)
            subprocess.run(["pdftotext", "-v"], check=True, timeout=10, env=TOOL_ENV)
            subprocess.run(["qpdf", "--version"], check=True, timeout=10, env=TOOL_ENV)
            ctypes.CDLL("libvips.so.42")
    print("Document tools verified; temporary DNS mappings removed")


def self_check_resolver_child():
    from unittest.mock import patch

    host = HOSTS[0]
    with tempfile.TemporaryDirectory() as directory:
        fixture = Path(directory, "resolver.py")
        fixture.write_text("import time\ntime.sleep(30)\n")
        real_spawn, children = subprocess.Popen, []

        def tracked_spawn(*args, **kwargs):
            child = real_spawn(*args, **kwargs)
            children.append(child)
            return child

        start = time.monotonic()
        with patch.dict(globals(), __file__=str(fixture), DNS_TIMEOUT=2), \
                patch.object(subprocess, "Popen", side_effect=tracked_spawn):
            try:
                resolve_https(host)
            except ToolError as error:
                assert error.args == ("DNS_DEADLINE",)
            else:
                raise AssertionError("Resolver child exceeded the total deadline")
        assert time.monotonic() - start < 5
        assert len(children) == 1 and children[0].poll() is not None, "Timed-out resolver child was not reaped"
        fixture.write_text("import json,os,sys\nassert sys.flags.isolated\n"
                           "assert 'SYNTHETIC_AMBIENT_TOKEN' not in os.environ\nprint(json.dumps(['1.1.1.1']))\n")
        with patch.dict(globals(), __file__=str(fixture)), patch.dict(
                os.environ, SYNTHETIC_AMBIENT_TOKEN="fixture-only"):
            assert resolve_https(host) == ["1.1.1.1"]
        for output in ("[]", '["127.0.0.1"]', '["1.1.1.1","1.1.1.1"]',
                       json.dumps(["1.1.1.1"] * 65), "{}", "not json", " " * 4097):
            fixture.write_text("print(" + repr(output) + ")\n")
            with patch.dict(globals(), __file__=str(fixture)):
                try:
                    resolve_https(host)
                except ToolError as error:
                    assert error.args == ("DNS_CHILD_OUTPUT",)
                else:
                    raise AssertionError("Invalid child output accepted")
        for message, expected in (("Document tools refused or failed [DNS_ANSWERS_MISSING]\n", "DNS_ANSWERS_MISSING"),
                                  ("https://invalid.example/SYNTHETIC_SECRET", "DNS_CHILD_FAILED")):
            fixture.write_text("import sys\nsys.stderr.write(" + repr(message) + ")\nsys.exit(1)\n")
            with patch.dict(globals(), __file__=str(fixture)):
                try:
                    resolve_https(host)
                except ToolError as error:
                    assert error.args == (expected,)
                else:
                    raise AssertionError("Failed resolver child accepted")


def self_check_cancellation():
    from contextlib import redirect_stderr
    import io
    import select
    import threading
    from unittest.mock import patch

    original_mask = signal.pthread_sigmask(signal.SIG_BLOCK, set())
    original_handlers = {sig: signal.getsignal(sig) for sig in CANCEL_SIGNALS}
    real_open, real_flock, real_defer = Path.open, fcntl.flock, defer_cancellation
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory, "hosts")
        original = b"127.0.0.1 localhost\n# retained concurrent edit\n"
        for point in ("open", "flock", "pre_defer", "pre_defer_body"):
            path.write_bytes(original)
            opens = locks = defers = 0
            body_error = RuntimeError("synthetic body") if point == "pre_defer_body" else None

            def open_hosts(target, *args, **kwargs):
                nonlocal opens
                if target == path:
                    opens += 1
                    if opens == 2 and point == "open":
                        signal.raise_signal(signal.SIGTERM)
                return real_open(target, *args, **kwargs)

            def flock_hosts(output, operation):
                nonlocal locks
                locks += 1
                assert operation & fcntl.LOCK_NB
                if locks == 2 and point == "flock":
                    signal.raise_signal(signal.SIGTERM)
                return real_flock(output, operation)

            def enter_cleanup():
                nonlocal defers
                defers += 1
                if defers == 2 and point.startswith("pre_defer"):
                    signal.raise_signal(signal.SIGTERM)
                return real_defer()

            with cancellation_handlers():
                try:
                    with patch.object(Path, "open", new=open_hosts), patch.object(fcntl, "flock", new=flock_hosts), \
                            patch.dict(globals(), defer_cancellation=enter_cleanup):
                        with temporary_hosts({HOSTS[0]: ["1.1.1.1"]}, path):
                            if body_error:
                                raise body_error
                except BaseException as error:
                    if body_error:
                        assert error is body_error
                    else:
                        assert isinstance(error, SystemExit) and error.code == 143
                else:
                    raise AssertionError("Deferred cancellation was lost")
            assert path.read_bytes() == original
            assert signal.pthread_sigmask(signal.SIG_BLOCK, set()) == original_mask
        with path.open("r+b") as blocker:
            real_flock(blocker, fcntl.LOCK_EX)
            start = time.monotonic()
            with patch.dict(globals(), HOSTS_LOCK_TIMEOUT=0.05):
                try:
                    with temporary_hosts({HOSTS[0]: ["1.1.1.1"]}, path):
                        raise AssertionError("Contended lock acquired")
                except ToolError as error:
                    assert error.args == ("HOSTS_LOCK_DEADLINE",)
            assert time.monotonic() - start < 0.5
        body_error = RuntimeError("SYNTHETIC_SECRET")
        opens = 0

        def failed_removal(target, *args, **kwargs):
            nonlocal opens
            if target == path:
                opens += 1
                if opens == 2:
                    raise OSError("SYNTHETIC_SECRET")
            return real_open(target, *args, **kwargs)

        stderr = io.StringIO()
        with redirect_stderr(stderr), patch.object(Path, "open", new=failed_removal):
            try:
                with temporary_hosts({HOSTS[0]: ["1.1.1.1"]}, path):
                    raise body_error
            except RuntimeError as error:
                assert error is body_error
            else:
                raise AssertionError("Body error was swallowed")
            report_error(ValueError("DNS answers missing"))
            report_error(body_error)
        assert "DNS_ANSWERS_MISSING" in stderr.getvalue() and "UNEXPECTED_OSError" in stderr.getvalue()
        assert "SYNTHETIC_SECRET" not in stderr.getvalue()
        path.write_bytes(original)
        defers, original_cancel = 0, None

        def failed_retry():
            nonlocal defers, original_cancel
            defers += 1
            if defers == 2:
                try:
                    signal.raise_signal(signal.SIGINT)
                except SystemExit as error:
                    original_cancel = error
                    raise
            if defers == 3:
                raise OSError("SYNTHETIC_SECRET")
            return real_defer()

        stderr = io.StringIO()
        with cancellation_handlers(), redirect_stderr(stderr), patch.dict(globals(), defer_cancellation=failed_retry):
            try:
                with temporary_hosts({HOSTS[0]: ["1.1.1.1"]}, path):
                    pass
            except SystemExit as error:
                assert error is original_cancel
            else:
                raise AssertionError("Retry failure replaced cancellation")
        assert defers == 3 and "UNEXPECTED_OSError" in stderr.getvalue()
        assert "SYNTHETIC_SECRET" not in stderr.getvalue()
    for phase in ("spawn", "wait"):
        child = subprocess.Popen([sys.executable, "-I", "-c",
                                  "import signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);"
                                  "print('ready',flush=True);time.sleep(30)"], start_new_session=True,
                                 stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        timers = []
        try:
            assert select.select([child.stdout], [], [], 2)[0] and child.stdout.readline() == b"ready\n"

            def owned_spawn(*args, **kwargs):
                if phase == "spawn":
                    signal.raise_signal(signal.SIGINT)
                return child

            with cancellation_handlers(), patch.dict(globals(), APT_CLEANUP_TIMEOUT=0.06):
                if phase == "wait":
                    timers = [threading.Timer(delay, os.kill, args=(os.getpid(), sig))
                              for delay, sig in ((0.02, signal.SIGINT), (0.04, signal.SIGTERM))]
                for timer in timers:
                    timer.start()
                try:
                    with patch.object(subprocess, "Popen", side_effect=owned_spawn):
                        apt(["update"], 2)
                except SystemExit as error:
                    assert error.code == 130
                else:
                    raise AssertionError("APT cancellation was lost")
                finally:
                    for timer in timers:
                        timer.cancel()
                        timer.join()
                assert child.poll() == -signal.SIGKILL
        finally:
            for timer in timers:
                timer.cancel()
                timer.join()
            if child.poll() is None:
                os.killpg(child.pid, signal.SIGKILL)
            child.wait(timeout=2)
            child.stdout.close()
    assert {sig: signal.getsignal(sig) for sig in CANCEL_SIGNALS} == original_handlers
    assert signal.pthread_sigmask(signal.SIG_BLOCK, set()) == original_mask


def self_check_spawn_signals():
    import select
    from unittest.mock import patch

    real_spawn, real_killpg = subprocess.Popen, os.killpg
    child, masks, kills = None, [], []

    def spawn_fixture(*args, **kwargs):
        nonlocal child
        child = real_spawn([sys.executable, "-I", "-c",
                            "import json,signal,time;"
                            "print(json.dumps([int(s) for s in signal.pthread_sigmask(signal.SIG_BLOCK,set())]),flush=True);"
                            "time.sleep(30)"], start_new_session=kwargs["start_new_session"], env=kwargs["env"],
                           stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
        assert select.select([child.stdout], [], [], 2)[0]
        masks.extend(json.loads(child.stdout.readline()))
        return child

    def stop_fixture(pid, signum):
        assert child is not None and pid == child.pid
        if signum:
            kills.append(signum)
        return real_killpg(pid, signum)

    try:
        with cancellation_handlers(), patch.object(subprocess, "Popen", side_effect=spawn_fixture), \
                patch.object(os, "killpg", side_effect=stop_fixture):
            try:
                apt(["update"], 0.05)
            except subprocess.TimeoutExpired:
                pass
            else:
                raise AssertionError("Owned fixture should outlast the test wait")
        assert int(signal.SIGTERM) not in masks and int(signal.SIGINT) not in masks
        assert kills == [signal.SIGTERM] and child.poll() == -signal.SIGTERM
    finally:
        if child is not None:
            if child.poll() is None:
                real_killpg(child.pid, signal.SIGKILL)
            child.wait(timeout=2)
            child.stdout.close()


def self_check_process_group(cancel_before_cleanup=False):
    import select
    from unittest.mock import patch

    class ObservedLeader:
        def __init__(self, process):
            self.process, self.failure = process, None

        def __getattr__(self, name):
            return getattr(self.process, name)

        def wait(self, *args, **kwargs):
            try:
                return self.process.wait(*args, **kwargs)
            except BaseException as error:
                self.failure = self.failure or error
                raise

    child_code = ("import os,signal,time;signal.signal(signal.SIGTERM,signal.SIG_IGN);"
                  "print('child:'+str(os.getpid()),flush=True);time.sleep(30)")
    for phase in ("timeout", "exited"):
        leader_code = ("import subprocess,sys,time;subprocess.Popen([sys.executable,'-I','-c',"
                       + repr(child_code) + "]);print('leader',flush=True);"
                       + ("sys.exit(7)" if phase == "exited" else "time.sleep(30)"))
        leader = subprocess.Popen([sys.executable, "-I", "-c", leader_code], start_new_session=True,
                                  stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=0)
        stopped = False
        try:
            ready = []
            for _ in range(2):
                assert select.select([leader.stdout], [], [], 2)[0]
                ready.append(leader.stdout.readline())
            assert b"leader\n" in ready and any(line.startswith(b"child:") for line in ready)
            if phase == "exited":
                assert leader.wait(timeout=2) == 7
            observed = ObservedLeader(leader)
            real_defer, defers, initial_errors = defer_cancellation, 0, []
            watched_code = apt.__code__
            expected_errors = (subprocess.TimeoutExpired, subprocess.CalledProcessError)

            def enter_cleanup():
                nonlocal defers
                defers += 1
                if cancel_before_cleanup and defers == 2:
                    signal.raise_signal(signal.SIGINT)
                return real_defer()

            def trace_error(frame, event, argument):
                if frame.f_code is watched_code and event == "exception" and \
                        isinstance(argument[1], expected_errors) and not initial_errors:
                    initial_errors.append(argument[1])
                return trace_error

            previous_trace = sys.gettrace()
            sys.settrace(trace_error)
            try:
                with cancellation_handlers(), patch.object(subprocess, "Popen", return_value=observed), \
                        patch.dict(globals(), APT_CLEANUP_TIMEOUT=0.1, defer_cancellation=enter_cleanup):
                    try:
                        apt(["update"], 0.05)
                    except subprocess.TimeoutExpired as error:
                        assert phase == "timeout" and error is observed.failure and error is initial_errors[0]
                    except subprocess.CalledProcessError as error:
                        assert phase == "exited" and error.returncode == 7 and error is initial_errors[0]
                    else:
                        raise AssertionError("Fixture failure was swallowed")
            finally:
                sys.settrace(previous_trace)
            assert defers == (3 if cancel_before_cleanup else 2)
            # The TERM-ignoring child keeps this pipe open while alive, even after its leader exits.
            assert select.select([leader.stdout], [], [], 2)[0] and leader.stdout.read(1) == b""
            assert leader.poll() == (7 if phase == "exited" else -signal.SIGTERM)
            stopped = True
        finally:
            if not stopped:
                try:
                    os.killpg(leader.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            leader.wait(timeout=2)
            leader.stdout.close()


def self_check_hosts_rollback(operations=("write", "truncate", "flush", "short_write", "rollback_flush")):
    from unittest.mock import patch

    real_open = Path.open
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory, "hosts")
        original = b"127.0.0.1 localhost\n# retained concurrent edit\n"
        for operation in operations:
            path.write_bytes(original)
            failure = OSError("synthetic post-" + operation)
            rollback_failure = OSError("synthetic rollback flush")
            real = path.open("r+b", buffering=0)

            class FaultyFile:
                calls = {}

                def __enter__(self):
                    return self

                def __exit__(self, *_):
                    real.close()

                def __getattr__(self, key):
                    return getattr(real, key)

                def write(self, data):
                    if operation == "short_write" and not self.calls.get("write"):
                        self.calls["write"] = 1
                        return real.write(data[:-1])
                    return self.perform("write", data)

                def truncate(self):
                    return self.perform("truncate")

                def flush(self):
                    return self.perform("flush")

                def perform(self, name, *args):
                    self.calls[name] = self.calls.get(name, 0) + 1
                    result = getattr(real, name)(*args)
                    if self.calls[name] == 1 and (operation == name or operation == "rollback_flush" and name == "truncate"):
                        raise failure
                    if operation == "rollback_flush" and name == "flush":
                        raise rollback_failure
                    return result

            opened = False

            def fault_open(target, *args, **kwargs):
                nonlocal opened
                if target == path and not opened:
                    opened = True
                    return FaultyFile()
                return real_open(target, *args, **kwargs)

            try:
                with patch.object(Path, "open", new=fault_open):
                    with temporary_hosts({HOSTS[0]: ["1.1.1.1"]}, path):
                        raise AssertionError("Failed hosts edit must not yield")
            except OSError as error:
                if operation == "short_write":
                    assert str(error) == "Short hosts write"
                else:
                    assert error is failure, "Rollback replaced the original error"
            else:
                raise AssertionError("Hosts edit failure was not propagated")
            assert path.read_bytes() == original, "Failed edit retained owned hosts bytes"


def self_check():
    from unittest.mock import patch

    if not __debug__:
        raise RuntimeError("Self-check requires Python assertions")
    host = HOSTS[0]
    answer = {"Status": 0, "TC": False, "CD": False, "Question": [{"name": host, "type": 1}],
              "Answer": [{"name": host, "type": 1, "data": "1.1.1.1"}]}
    assert parse_addresses(host, json.dumps(answer)) == ["1.1.1.1"]
    dotted = {**answer, "Question": [{"name": host.upper() + ".", "type": 1}],
              "Answer": [{"name": host + ".", "type": 1, "data": "1.1.1.1"}]}
    assert parse_addresses(host, json.dumps(dotted)) == ["1.1.1.1"]
    # Observed Azure owner chain; the public terminal IP is synthetic for offline QA.
    middle = "ubuntu-archive-asm.trafficmanager.net"
    terminal = "cloud-mirror-lb.swedencentral.cloudapp.azure.com"
    chain = {**answer, "Answer": [{"name": host, "type": 5, "data": middle},
                                  {"name": middle, "type": 5, "data": terminal},
                                  {"name": terminal, "type": 1, "data": "1.1.1.1"}]}
    assert parse_addresses(host, json.dumps(chain)) == ["1.1.1.1"]
    for bad in ("127.0.0.1", "10.1.2.3", "169.254.1.2", "224.0.0.1", "::1", "bad"):
        changed = {**answer, "Answer": [{"name": host, "type": 1, "data": bad}]}
        try:
            parse_addresses(host, json.dumps(changed))
        except ValueError:
            pass
        else:
            raise AssertionError("Unsafe address accepted")
    for raw in ("not json", "{}", json.dumps({**answer, "Status": 3}),
                json.dumps({**answer, "Status": False}), json.dumps({**answer, "Answer": []}),
                json.dumps({**answer, "TC": True}), json.dumps({**answer, "CD": True}),
                json.dumps({**answer, "Question": [{"name": host, "type": True}]}),
                json.dumps({**answer, "Question": [{"name": host + "..", "type": 1}]}),
                json.dumps({**answer, "Answer": [{"name": "other.example", "type": 1, "data": "1.1.1.1"}]}),
                json.dumps({**answer, "Answer": [{"name": host, "type": True, "data": "1.1.1.1"}]}),
                json.dumps({**answer, "Answer": [{"name": host, "type": 5, "data": "other.example"}]}),
                json.dumps({**answer, "Answer": [{"name": host, "type": 5, "data": middle},
                                                {"name": middle, "type": 5, "data": host}]}),
                json.dumps({**answer, "Answer": answer["Answer"] + [{"name": host, "type": 5, "data": middle}]}),
                json.dumps({**chain, "Answer": chain["Answer"] + [{"name": host, "type": 5, "data": terminal}]}),
                json.dumps({**answer, "Question": [{"name": "other.example", "type": 1}]}),
                '{"Status":0,"Status":0}', " " * (LIMIT + 1)):
        try:
            parse_addresses(host, raw)
        except ValueError:
            pass
        else:
            raise AssertionError("Malformed response accepted")
    with patch.dict(globals(), lookup=lambda _: True, resolve_https=lambda _: 1 / 0):
        assert fallback_addresses() == {}
    resolved = []
    with patch.dict(globals(), lookup=lambda value: value != host,
                    resolve_https=lambda value: resolved.append(value) or ["1.1.1.1"]):
        assert fallback_addresses() == {host: ["1.1.1.1"]} and resolved == [host]
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory, "hosts")
        original = b"127.0.0.1 localhost\n# existing\n"
        path.write_bytes(original)
        with temporary_hosts({host: ["1.1.1.1"]}, path):
            with path.open("ab") as output:
                output.write(b"# concurrent edit\n")
        assert path.read_bytes() == original + b"# concurrent edit\n"
        with temporary_hosts({}, path):
            assert path.read_bytes() == original + b"# concurrent edit\n"
        for failure in (OSError("synthetic preappend I/O"), SystemExit(143)):
            with path.open("r+b") as cleanup:
                try:
                    with patch.object(Path, "open", side_effect=[failure, cleanup]):
                        with temporary_hosts({host: ["1.1.1.1"]}, path):
                            raise AssertionError("Preappend failure must not yield")
                except BaseException as error:
                    assert error is failure, "Preappend cleanup masked the original failure"
            assert path.read_bytes() == original + b"# concurrent edit\n"
        with cancellation_handlers():
            try:
                with temporary_hosts({host: ["1.1.1.1"]}, path):
                    signal.raise_signal(signal.SIGTERM)
            except SystemExit as error:
                assert error.code == 143
            else:
                raise AssertionError("SIGTERM did not interrupt the fixture")
        assert path.read_bytes() == original + b"# concurrent edit\n"
        real_open = Path.open
        postcommit = False

        class PostCommitFile:
            def __init__(self, output):
                self.output = output

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return self.output.__exit__(*args)

            def __getattr__(self, name):
                return getattr(self.output, name)

            def flush(self):
                nonlocal postcommit
                self.output.flush()
                postcommit = True
                with real_open(path, "ab") as output:
                    output.write(b"# postcommit edit\n")
                signal.raise_signal(signal.SIGTERM)

        def pending_term(target, *args, **kwargs):
            output = real_open(target, *args, **kwargs)
            return PostCommitFile(output) if target == path and not postcommit else output

        with cancellation_handlers():
            try:
                with patch.object(Path, "open", new=pending_term):
                    with temporary_hosts({host: ["1.1.1.1"]}, path):
                        raise AssertionError("Pending SIGTERM must interrupt before yield")
            except SystemExit as error:
                assert error.code == 143
        assert path.read_bytes() == original + b"# concurrent edit\n# postcommit edit\n"
        missing = Path(directory, "must-not-be-opened")
        with temporary_hosts({}, missing):
            assert not missing.exists()
    with patch.object(sys, "platform", "linux"), patch.object(os, "geteuid", return_value=0):
        with patch.dict(os.environ, {"CI": "true", "GITHUB_ACTIONS": "true", "RUNNER_OS": "Linux",
                                     "RUNNER_ENVIRONMENT": "self-hosted"}, clear=True):
            with patch.dict(globals(), fallback_addresses=lambda: 1 / 0):
                try:
                    main()
                except RuntimeError:
                    pass
                else:
                    raise AssertionError("Persistent self-hosted runner accepted")
    self_check_resolver_child()
    self_check_cancellation()
    self_check_spawn_signals()
    self_check_process_group()
    self_check_process_group(cancel_before_cleanup=True)
    self_check_hosts_rollback()
    print("Offline document-tools self-check passed")


if __name__ == "__main__":
    try:
        if sys.argv[1:] == ["--self-check"]:
            self_check()
        elif len(sys.argv) == 3 and sys.argv[1] == "--resolve-host":
            if sys.platform != "linux" or not sys.flags.isolated:
                raise ToolError("DNS_CHILD_MODE_REFUSED")
            print(json.dumps(resolve_https_child(sys.argv[2])))
        elif sys.argv[1:]:
            raise ToolError("ARGUMENTS_REFUSED")
        else:
            main()
    except Exception as error:
        report_error(error)
        raise SystemExit(1)
