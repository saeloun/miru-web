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
from contextlib import contextmanager
from urllib.request import HTTPRedirectHandler, Request, build_opener
import uuid

HOSTS = ("azure.archive.ubuntu.com", "archive.ubuntu.com", "security.ubuntu.com")
LIMIT = 65536
TOOL_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C.UTF-8",
            "DEBIAN_FRONTEND": "noninteractive"}


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


def resolve_https(host):
    if host not in HOSTS:
        raise ValueError("Unapproved DNS host")
    request = Request("https://cloudflare-dns.com/dns-query?name=" + host + "&type=A",
                      headers={"Accept": "application/dns-json"})
    with build_opener(NoRedirect()).open(request, timeout=10) as response:
        if response.headers.get_content_type() != "application/dns-json":
            raise ValueError("Unexpected DNS content type")
        return parse_addresses(host, response.read(LIMIT + 1))


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
        with path.open("r+b") as output:
            fcntl.flock(output, fcntl.LOCK_EX)
            # Commit ownership before a pending termination can be delivered.
            previous = signal.pthread_sigmask(signal.SIG_BLOCK, {signal.SIGTERM, signal.SIGINT})
            try:
                current = output.read()
                if append:
                    updated = current + block
                else:
                    if current.count(block) != 1:
                        raise ValueError("Owned hosts block changed; refusing replacement")
                    updated = current.replace(block, b"", 1)
                output.seek(0)
                output.write(updated)
                output.truncate()
                output.flush()
                installed = append
            finally:
                signal.pthread_sigmask(signal.SIG_SETMASK, previous)

    try:
        edit_hosts(append=True)
        yield
    finally:
        # Read the latest contents, not a saved original: retain other writers' edits.
        if installed:
            edit_hosts(append=False)


def apt(arguments, timeout):
    command = ["apt-get", "-o", "Acquire::ForceIPv4=true",
               "-o", "Acquire::http::Timeout=15", "-o", "Acquire::https::Timeout=15",
               "-o", "APT::Update::Error-Mode=any", *arguments]
    process = subprocess.Popen(command, start_new_session=True, env=TOOL_ENV)
    try:
        code = process.wait(timeout=timeout)
        if code:
            raise subprocess.CalledProcessError(code, command)
    except BaseException:
        if process.poll() is None:
            os.killpg(process.pid, signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait(timeout=5)
        raise


def interrupted(signum, _frame):
    raise SystemExit(128 + signum)


def main():
    if (sys.platform != "linux" or os.geteuid() != 0 or os.environ.get("RUNNER_OS") != "Linux"
            or os.environ.get("RUNNER_ENVIRONMENT") != "github-hosted"
            or any(os.environ.get(key) != "true" for key in ("CI", "GITHUB_ACTIONS"))):
        raise RuntimeError("Linux root GitHub-hosted runner required")
    handlers = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGTERM, signal.SIGINT)}
    try:
        addresses = fallback_addresses()
        print(f"Document tools: temporary DNS fallback for {len(addresses)} fixed hosts", flush=True)
        with temporary_hosts(addresses):
            apt(["update"], 120)
            apt(["install", "--no-install-recommends", "-y", "poppler-utils", "qpdf", "libvips42t64"], 300)
            subprocess.run(["pdftotext", "-v"], check=True, timeout=10, env=TOOL_ENV)
            subprocess.run(["qpdf", "--version"], check=True, timeout=10, env=TOOL_ENV)
            ctypes.CDLL("libvips.so.42")
    finally:
        for sig, handler in handlers.items():
            signal.signal(sig, handler)
    print("Document tools verified; temporary DNS mappings removed")


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
        previous = signal.signal(signal.SIGTERM, interrupted)
        try:
            with temporary_hosts({host: ["1.1.1.1"]}, path):
                signal.raise_signal(signal.SIGTERM)
        except SystemExit as error:
            assert error.code == 143
        else:
            raise AssertionError("SIGTERM did not interrupt the fixture")
        finally:
            signal.signal(signal.SIGTERM, previous)
        assert path.read_bytes() == original + b"# concurrent edit\n"
        real_mask = signal.pthread_sigmask

        def pending_term(how, mask):
            if how == signal.SIG_SETMASK and b"# BEGIN miru-document-tools-" in path.read_bytes():
                with path.open("ab") as output:
                    output.write(b"# postcommit edit\n")
                signal.raise_signal(signal.SIGTERM)
            return real_mask(how, mask)

        previous = signal.signal(signal.SIGTERM, interrupted)
        try:
            with patch.object(signal, "pthread_sigmask", side_effect=pending_term):
                with temporary_hosts({host: ["1.1.1.1"]}, path):
                    raise AssertionError("Pending SIGTERM must interrupt before yield")
        except SystemExit as error:
            assert error.code == 143
        finally:
            signal.signal(signal.SIGTERM, previous)
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
    print("Offline document-tools self-check passed")


if __name__ == "__main__":
    try:
        if sys.argv[1:] == ["--self-check"]:
            self_check()
        elif sys.argv[1:]:
            raise ValueError("Only --self-check is supported")
        else:
            main()
    except Exception as error:
        print(f"Document tools refused or failed ({type(error).__name__})", file=sys.stderr)
        raise SystemExit(1)
