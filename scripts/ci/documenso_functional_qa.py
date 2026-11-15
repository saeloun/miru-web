#!/usr/bin/env python3
"""Manual, exact-artifact Documenso QA on an ephemeral GitHub-hosted Linux VM."""

import argparse
from contextlib import contextmanager
import errno
import gzip
import grp
import hashlib
import io
from itertools import chain
import json
import os
from pathlib import Path, PurePosixPath
import pwd
import re
import secrets
import shutil
import signal
import socket
import stat
import subprocess
import sys
import tarfile
import tempfile
import threading
import time
from urllib.request import ProxyHandler, HTTPRedirectHandler, build_opener
import uuid
import zipfile
import zlib

HEAD = "4aa6ff5744267b1942bbf614fac322c8c1184bf7"
TREE = "78ebb54286ecaa1bb7caa75162aafc52e34b41eb"
CHECKOUT = "3e26e7ba9574b552b0c21dbb417e2135b01ec1a5"
UPSTREAM = "8707e33c124e4b1a68dde92d5e05178c9aabd0be"
ARTIFACT_ID, RUN_ID = 13822868908, 42946388869
RELEASE_ID, IMAGE_ASSET_ID, MANIFEST_ASSET_ID = 446291311, 752024163, 752024161
QA_TAG = "documenso-qa-4aa6ff574-20261116"
IMAGE_ASSET_NAME = "documenso-8707e33-image-4aa6ff574-amd64.zip"
TRANSPORT_MANIFEST = "IMAGE-TRANSPORT-ADMISSION-20261116.json"
TRANSPORT_MANIFEST_SHA = "684d99385879277d674f35f3169829b9ffbbc5bc06dd4e2da186c84b8bd1cb7d"
ZIP_SHA = "a3f905b026083cb8c4e8e261dae4e3642919a4f1376d44375e6b6b2ad5767590"
ARCHIVE_SHA = "d7f3c0b767094cc9f1602397c86d2faa25e44872d86b71cbd039226513f5ff85"
CONFIG_SHA = "6b1d4c45a24da11e2f1c66da8eb486832660e4565334689c91ef9353fe158f49"
DIFF_IDS_SHA = "69fbb4154339321f3932a9489db5c499f5efbac4bb58e350e676a9ef08d68e31"
DOCKER_SHA = "2d8ecf2fe6650ab8ba639d7d47752e8bdf9f890be3712f4e31cd4cf169998388"
LICENSE_SHA = "8486a10c4393cee1c25392769ddd3b2d6c242d6ec7928e1414efff7dfb2f07ef"
PATCHES = {"documenso-security-hardening.patch": "b7a6450dae468e76708a45479e1660e1d1a0c9e6bc6d6b45a6c97dddeae89d3f",
           "documenso-signing-compatibility.patch": "3c1154411b0e0196e962932253f018700ad71fc3642e0bd4535f302def1cdd6f"}
SOURCE_RELEASE = "https://github.com/saeloun/miru-web/releases/tag/documenso-source-4aa6ff574"
SOURCE_ASSETS = {
    "documenso-8707e33-source-4aa6ff574-amd64.tar.gz": ("source.tar.gz", 58498058, "5b94ae4dc456b853964100cebc1263819bac762b7c9205cc8a8675f8ae916ee2"),
    "SHA256SUMS": ("SHA256SUMS", 200, "462ca3b2e8dca0ca4f429f19297482bf1c1d111a33746cd80158bd04685ddfb9"),
    "SOURCE-ADMISSION.md": ("SOURCE-ADMISSION.md", 3562, "ea7e75b37c2663c5dc3c3a841d29e7e8f67dd98240300a2c4a7d7db83cf76e9f"),
}
# Public Docker Hub index/AMD64 child/config readback, 2026-11-11 16:09 UTC; new QA inputs.
IMAGES = {
    "database": ("postgres@sha256:4717f90960a225c2d1c5dac50508c401230f693ff626e06e84e6db0a68ded508", "aac5ed9e090c8b3e134bf1dcf3f9fe0787a29cecdf7867de8b53b5d8abc3eef2", "17.11-alpine3.24", "e5d2edd28b1f8d40a0a6c0c9cdc545b19b56a0d5d88f94bc11a97d970d4700d0"),
    "mailpit": ("axllent/mailpit@sha256:c95e8356f55b65520e8b7fd4d74d3e2d06e4a83513f639e316b1e592fbd52646", "cfdafb05e489fd0a93f82045a641610317dbaa7ea1da3d7a847cdb82f1001937", None, "aef2aacc11f075ec0fb6874275ee4a421e688e11a96ebb296134d1735c7761ce"),
    "proxy": ("nginx@sha256:bb8f722b4be005fcd7827816a136ab779fd40185d85b5171be915cc7fc0575c7", "1390db6b01a8b0c865b157c7f036b0772534418b1701f598737de546d208b6e4", "1.30.6-alpine", "583b7f2fce1cdb8da5ad5c39ebd3c33b98b87d493190e548bdee1fa8c619c311"),
}
PHASES = {"admitted", "provider_account", "provider_key", "fixtures", "upload", "fields", "review", "send", "sign", "archive", "share", "source", "denials", "packet_complete", "complete"}
SCREENSHOTS = {f"screenshots/source-{kind}-{width}.png" for kind in ("public", "auth", "error") for width in (1440, 375)}
SCREENSHOTS |= {f"screenshots/{kind}-{packet}-{width}.png" for kind in ("placement", "signed", "archive", "source-signing", "source-embed") for packet in ("client", "consultant") for width in (1440, 375)}
SCREENSHOTS |= {"share-client.png", "share-consultant.png"}
HEX = re.compile(r"[0-9a-f]{64}\Z")
BASE_ENV = {"PATH": "/usr/sbin:/usr/bin:/sbin:/bin", "LANG": "C.UTF-8", "HOME": "/nonexistent"}
FORBIDDEN_FLAGS = ("no-sandbox", "disable-setuid-sandbox", "disable-web-security", "disable-site-isolation", "ignore-certificate-errors", "single-process", "no-zygote", "--proxy-server", "--host-resolver-rules")
RELAY_SOCKETS = ("/run/dbus/system_bus_socket", "/run/systemd/resolve/io.systemd.Resolve", "/run/nscd/socket", "/var/run/nscd/socket", "/run/nslcd/socket", "/run/avahi-daemon/socket", "/run/systemd/machine/io.systemd.Machine", "/run/samba/winbindd/pipe", "/var/lib/samba/winbindd_privileged/pipe")
_cancel_depth = 0
_pending_cancel = None


def require(value, message="Functional QA admission refused"):
    if not value:
        raise RuntimeError(message)


def report_failure(error):
    allowed = (RuntimeError, AssertionError, OSError, FileNotFoundError, PermissionError, TimeoutError, ValueError, TypeError, KeyError,
               subprocess.CalledProcessError, subprocess.TimeoutExpired, json.JSONDecodeError, zipfile.BadZipFile, tarfile.TarError)
    kind = type(error).__name__ if type(error) in allowed else "Exception"
    line = 0
    frame = error.__traceback__
    while frame is not None:
        if frame.tb_frame.f_code.co_filename == __file__ and frame.tb_frame.f_code is not require.__code__:
            line = frame.tb_lineno
        frame = frame.tb_next
    print(f"Functional QA refused or failed ({kind}, adapter_line={line}); only sanitized evidence may be uploaded", file=sys.stderr)


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "Duplicate JSON key refused")
        result[key] = value
    return result


def read_json(path, limit=1024 * 1024):
    return json.loads(read_regular(path, limit), object_pairs_hook=unique_object)


def read_regular(path, limit):
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        require(stat.S_ISREG(info.st_mode) and info.st_size <= limit)
        data = stream.read(limit + 1)
        require(len(data) <= limit)
        return data


def digest(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def private(path, value, uid=None):
    path.parent.mkdir(parents=True, exist_ok=True)
    data = value.encode() if isinstance(value, str) else value
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | os.O_NOFOLLOW, 0o600)
    with os.fdopen(descriptor, "wb") as output:
        if uid is not None:
            os.fchown(output.fileno(), os.geteuid(), pwd.getpwuid(uid).pw_gid)
            os.fchmod(output.fileno(), 0o640)
        output.write(data)


def checked(command, *, input=None, timeout=30, env=None, cwd=None):
    return subprocess.run(command, input=input, capture_output=True, check=True, timeout=timeout,
                          env=BASE_ENV if env is None else env, cwd=cwd).stdout


def selected_config(raw):
    expected = {("architecture",): "amd64", ("os",): "linux", ("rootfs", "type"): "layers",
                ("config", "Labels", "org.opencontainers.image.source"): "https://github.com/documenso/documenso",
                ("config", "Labels", "org.opencontainers.image.revision"): UPSTREAM,
                ("config", "Labels", "io.miru.build-revision"): CHECKOUT}
    paths = list(expected) + [("rootfs", "diff_ids", i) for i in range(23)]
    selector = 'select(length==2 and (.[0] as $p | any($allowed[]; .==$p) or (($p|length)==3 and $p[0]=="rootfs" and $p[1]=="diff_ids" and ($p[2]|type)=="number")))'
    output = checked(["jq", "--stream", "-c", "--argjson", "allowed", json.dumps(paths), selector], input=raw, timeout=10)
    rows = [json.loads(line, object_pairs_hook=unique_object) for line in output.splitlines()]
    require(len(rows) == len(paths))
    selected = {tuple(row[0]): row[1] for row in rows}
    require(len(selected) == len(rows) and all(selected.get(key) == value for key, value in expected.items()))
    diff_ids = [selected.get(("rootfs", "diff_ids", i)) for i in range(23)]
    require(all(isinstance(value, str) and re.fullmatch(r"sha256:[0-9a-f]{64}", value) for value in diff_ids))
    require(hashlib.sha256(("\n".join(diff_ids) + "\n").encode()).hexdigest() == DIFF_IDS_SHA)
    return diff_ids


def safe_tar_members(archive):
    members = archive.getmembers()
    require(0 < len(members) < 2000 and len({member.name for member in members}) == len(members))
    for member in members:
        name = PurePosixPath(member.name)
        require(name.parts and not name.is_absolute() and ".." not in name.parts and "\\" not in member.name)
        require(member.name.rstrip("/") == str(name) and (member.isfile() or member.isdir()))
    return members


def verify_transport(directory):
    release = read_json(directory / "release-metadata.json")
    tag = read_json(directory / "tag-metadata.json")
    run = read_json(directory / "run-metadata.json")
    require(release.get("id") == RELEASE_ID and release.get("tag_name") == QA_TAG and release.get("target_commitish") == HEAD)
    require(release.get("prerelease") is True and release.get("draft") is False)
    require(tag.get("ref") == "refs/tags/" + QA_TAG and tag["object"].get("type") == "commit" and tag["object"].get("sha") == HEAD)
    assets = release.get("assets")
    require(isinstance(assets, list) and len(assets) == 2)
    for name, expected in (
        ("image-asset-metadata.json", {"id": IMAGE_ASSET_ID, "name": IMAGE_ASSET_NAME, "size": 450162450, "digest": "sha256:" + ZIP_SHA, "state": "uploaded"}),
        ("manifest-asset-metadata.json", {"id": MANIFEST_ASSET_ID, "name": TRANSPORT_MANIFEST, "size": 2688, "digest": "sha256:" + TRANSPORT_MANIFEST_SHA, "state": "uploaded"}),
    ):
        asset = read_json(directory / name)
        require(all(asset.get(key) == value for key, value in expected.items()))
        require(sum(all(entry.get(key) == value for key, value in expected.items()) for entry in assets) == 1)
    raw = read_regular(directory / TRANSPORT_MANIFEST, 2688)
    require(len(raw) == 2688 and hashlib.sha256(raw).hexdigest() == TRANSPORT_MANIFEST_SHA)
    admission = json.loads(raw, object_pairs_hook=unique_object)
    require(admission.get("schema_version") == 1)
    original = admission["original_artifact"]
    require(original.get("id") == ARTIFACT_ID and original.get("historically_recorded_api_digest") == "sha256:" + ZIP_SHA and
            original.get("historically_recorded_api_size") == 450162450)
    source_name = "documenso-8707e33-source-4aa6ff574-amd64.tar.gz"
    _, source_size, source_sha = SOURCE_ASSETS[source_name]
    required = {
        "qa_release": {"tag": QA_TAG, "target_commit": HEAD, "prerelease": True, "latest": False},
        "original_build": {"repository": "saeloun/miru-web", "run_id": RUN_ID, "attempt": 1, "head": HEAD, "checkout": CHECKOUT,
                           "workflow": ".github/workflows/documenso-build.yml", "status": "completed", "conclusion": "success"},
        "image_asset": {"name": IMAGE_ASSET_NAME, "bytes": 450162450, "sha256": ZIP_SHA},
        "inner_archive": {"name": "image.tar.gz", "bytes": 449955956, "sha256": ARCHIVE_SHA},
        "image": {"platform": "linux/amd64", "upstream": UPSTREAM, "opaque_config_sha256": CONFIG_SHA, "layers": 23,
                  "uncompressed_layer_bytes": 1525317632, "rootfs_diff_ids_sha256": DIFF_IDS_SHA},
        "source_release": SOURCE_RELEASE.rsplit("/", 1)[1],
        "source_asset": {"name": source_name, "bytes": source_size, "sha256": source_sha},
    }
    require(all(admission.get(key) == value for key, value in required.items()))
    require(run.get("id") == RUN_ID and run.get("run_attempt") == 1 and run.get("head_sha") == HEAD)
    require(run.get("status") == "completed" and run.get("conclusion") == "success")
    require(run.get("path") == ".github/workflows/documenso-build.yml" and run["repository"]["id"] == 433874407)


def verify_artifact(path, destination):
    verify_transport(path.parent)
    require(path.name == IMAGE_ASSET_NAME and path.is_file() and not path.is_symlink() and path.stat().st_size == 450162450 and digest(path) == ZIP_SHA)
    expected = {"image.tar.gz", "provenance.json", "SHA256SUMS", "LICENSE", "SOURCE.md", "source/Dockerfile"} | {"source/" + name for name in PATCHES}
    with zipfile.ZipFile(path) as archive:
        entries = archive.infolist()
        require(len(entries) == len(expected) and {entry.filename for entry in entries} == expected)
        for entry in entries:
            require(not stat.S_ISLNK(entry.external_attr >> 16) and not entry.flag_bits & 1)
            require(entry.file_size <= (3 * 1024**3 if entry.filename == "image.tar.gz" else 4 * 1024**2))
        require(archive.testzip() is None)
        provenance = json.loads(archive.read("provenance.json"), object_pairs_hook=unique_object)
        required = {"workflow_run_id": str(RUN_ID), "workflow_run_attempt": "1", "upstream_revision": UPSTREAM,
                    "platform": "linux/amd64", "checkout_revision": CHECKOUT, "pull_request_head_revision": HEAD,
                    "registry_published": False, "application_started": False, "patch_sha256": PATCHES,
                    "node_base": "node@sha256:13cf9d4c07e847a41b81b0f24461bea41ec8bcd0a5c00e2ab88e2ba1159b54d4",
                    "prepared_dockerfile_sha256": DOCKER_SHA, "license_sha256": LICENSE_SHA,
                    "archive_sha256": ARCHIVE_SHA, "archive_bytes": 449955956,
                    "archive_config_sha256": CONFIG_SHA, "docker_image_id": "sha256:" + CONFIG_SHA,
                    "image_reference": "documenso-amd64:" + CHECKOUT}
        require(all(provenance.get(key) == value for key, value in required.items()))
        notice = f"Upstream: https://github.com/documenso/documenso/tree/{UPSTREAM}\nPatches (also included in source/): https://github.com/saeloun/miru-web/tree/{HEAD}/docs/qa/generic-document-signing-2462\nThe prepared Dockerfile is included in source/. See provenance.json for checkout, PR head, source, base and archive hashes.\n"
        require(archive.read("SOURCE.md").decode() == notice and archive.read("SHA256SUMS").decode() == ARCHIVE_SHA + "  image.tar.gz\n")
        for name, sha in {"source/Dockerfile": DOCKER_SHA, "LICENSE": LICENSE_SHA, **{"source/" + name: sha for name, sha in PATCHES.items()}}.items():
            require(hashlib.sha256(archive.read(name)).hexdigest() == sha)
        image = destination / "image.tar.gz"
        with archive.open("image.tar.gz") as source, image.open("xb") as target:
            shutil.copyfileobj(source, target)
    require(image.stat().st_size == 449955956 and digest(image) == ARCHIVE_SHA)
    with tarfile.open(image, "r:gz") as archive:
        safe_tar_members(archive)
        member = archive.getmember("manifest.json")
        require(member.isfile() and member.size <= 65536)
        manifests = json.load(archive.extractfile(member), object_pairs_hook=unique_object)
        require(isinstance(manifests, list) and len(manifests) == 1)
        manifest = manifests[0]
        require(manifest["RepoTags"] == ["documenso-amd64:" + CHECKOUT])
        config = archive.getmember(manifest["Config"])
        require(config.isfile() and config.size <= 262144)
        raw = archive.extractfile(config).read()
        require(hashlib.sha256(raw).hexdigest() == CONFIG_SHA)
        require(PurePosixPath(config.name).stem == CONFIG_SHA or PurePosixPath(config.name).name == CONFIG_SHA)
        diff_ids = selected_config(raw)
        layers = manifest["Layers"]
        require(len(layers) == len(set(layers)) == 23)
        total = 0
        for index, name in enumerate(layers):
            layer = archive.getmember(name)
            require(layer.isfile())
            payload = archive.extractfile(layer)
            stream = gzip.GzipFile(fileobj=payload) if payload.peek(2).startswith(b"\x1f\x8b") else payload
            sha = hashlib.sha256()
            while chunk := stream.read(1024 * 1024):
                total += len(chunk)
                require(total <= 8 * 1024**3)
                sha.update(chunk)
            require("sha256:" + sha.hexdigest() == diff_ids[index])
        require(total == 1525317632)
    return image, diff_ids


def mem_available():
    return int(next(line.split()[1] for line in Path("/proc/meminfo").read_text().splitlines() if line.startswith("MemAvailable:"))) * 1024


def capacity(path, docker_root):
    require(min(shutil.disk_usage(path).free, shutil.disk_usage(docker_root).free) >= 12 * 1024**3, "Disk floor below12GiB")
    require(mem_available() >= 5.5 * 1024**3 and mem_available() - 2240 * 1024**2 >= 3 * 1024**3, "Memory admission refused")


def process_identity(pid):
    root = Path("/proc") / str(pid)
    if not root.exists():
        return None
    fields = (root / "stat").read_text().rsplit(")", 1)[1].split()
    uid = int(next(line.split()[1] for line in (root / "status").read_text().splitlines() if line.startswith("Uid:")))
    return {"pid": pid, "start": fields[19], "uid": uid}


def uid_processes(uid):
    result = []
    for entry in Path("/proc").iterdir():
        if entry.name.isdigit():
            try:
                identity = process_identity(int(entry.name))
                if identity and identity["uid"] == uid:
                    result.append(identity)
            except (FileNotFoundError, ProcessLookupError):
                pass
    return result


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        raise RuntimeError("Unexpected local redirect")


def local_json(url):
    require(re.fullmatch(r"http://127\.0\.0\.1:[0-9]+/[a-zA-Z0-9/_-]*", url))
    with build_opener(ProxyHandler({}), NoRedirect()).open(url, timeout=3) as response:
        return json.loads(response.read(65537), object_pairs_hook=unique_object)


def port_range(raw):
    values = raw.split()
    require(len(values) == 2 and all(value.isdigit() for value in values))
    first, last = map(int, values)
    require(1 <= first <= last <= 65535)
    return first, last


def free_port(used, ephemeral, address="127.0.0.1"):
    for port in chain(range(20000, 65536), range(1024, 20000)):
        if port in used or ephemeral[0] <= port <= ephemeral[1]:
            continue
        with socket.socket(socket.AF_INET6 if ":" in address else socket.AF_INET) as listener:
            try:
                listener.bind((address, port))
            except OSError as error:
                if error.errno == errno.EADDRINUSE:
                    continue
                raise
        used.add(port)
        return port
    raise RuntimeError("No owned port outside the ephemeral range")


def unix_listeners(raw):
    lines = raw.decode().splitlines()
    require(lines and lines[0].split() == ["Num", "RefCount", "Protocol", "Flags", "Type", "St", "Inode", "Path"] and len(lines) <= 16384)
    result = []
    for line in lines[1:]:
        fields = line.split(None, 7)
        require(len(fields) in (7, 8) and all(re.fullmatch(r"[0-9a-fA-F]+", value) for value in fields[1:6]) and fields[6].isdigit())
        if len(fields) == 8 and (int(fields[3], 16) & 0x10000 or int(fields[4], 16) == 2):
            require(int(fields[4], 16) in (1, 2, 5) and int(fields[6]) > 0)
            result.append((int(fields[6]), fields[7], int(fields[4], 16)))
    require(len(result) == len(set(result)))
    return result


def unix_admission_paths(listeners):
    require(all(address.startswith("/") and "\x00" not in address for _, address, _ in listeners), "Unreviewed abstract or relative Unix listener")
    return {address for _, address, _ in listeners}


RUNNER_STORAGE_SOCKETS = {
    "multipathd.socket": ("@/org/kernel/linux/storage/multipathd", "multipathd.service"),
    "iscsid.socket": ("@ISCSIADM_ABSTRACT_NAMESPACE", "iscsid.service"),
    "iscsiuio.socket": ("@ISCSID_UIP_ABSTRACT_NAMESPACE", "iscsiuio.service"),
}


def runner_storage_state():
    devices = list(Path("/sys/block").iterdir())
    try:
        sessions = list(Path("/sys/class/iscsi_session").iterdir())
    except FileNotFoundError:
        sessions = []
    # Other mapper targets can back the runner's root disk without using multipathd.
    multipath_maps = bool(checked(["dmsetup", "ls", "--target", "multipath"]).strip()) if any(device.name.startswith("dm-") for device in devices) else False
    return multipath_maps, bool(sessions)


def runner_storage_units(listeners, unit_listens, multipath_maps, iscsi_sessions):
    abstract = [(address, kind) for _, address, kind in listeners if not address.startswith("/")]
    if not abstract:
        return []
    require(not multipath_maps and not iscsi_sessions, "Runner storage is in use")
    units = set()
    for address, kind in abstract:
        matches = [(unit, service) for unit, (expected, service) in RUNNER_STORAGE_SOCKETS.items() if address == expected and kind == 1]
        require(len(matches) == 1, "Unreviewed runner storage socket")
        unit, service = matches[0]
        lines = unit_listens.get(unit, "").splitlines()
        require(all("=" in line for line in lines))
        properties = unique_object(line.split("=", 1) for line in lines if not line.startswith("Listen="))
        require(properties.get("Id") == unit and properties.get("Accept") == "no" and properties.get("Triggers") == service,
                "Runner storage unit identity does not match")
        fields = [line.removeprefix("Listen=").split() for line in lines if line.startswith("Listen=")]
        require(all(len(entry) == 2 for entry in fields) and [address, "(Stream)"] in fields, "Runner socket unit does not match")
        units.add((unit, service))
    return [name for pair in sorted(units) for name in pair]


def unix_isolated(listeners, baseline, owned_inodes):
    require(all((inode, address, kind) in baseline or inode in owned_inodes for inode, address, kind in listeners), "Unreviewed Unix listener appeared")


def owned_unix_inodes(uid):
    result = set()
    for process in uid_processes(uid):
        inodes = set()
        try:
            for path in (Path("/proc") / str(process["pid"]) / "fd").iterdir():
                try:
                    match = re.fullmatch(r"socket:\[(\d+)\]", os.readlink(path))
                    if match:
                        inodes.add(int(match[1]))
                except FileNotFoundError:
                    pass
        except FileNotFoundError:
            pass
        try:
            if process_identity(process["pid"]) == process:
                result.update(inodes)
        except FileNotFoundError:
            pass
    return result


def acl_entries(raw):
    entries = {}
    for line in raw.decode().splitlines():
        line = line.split("#", 1)[0].strip()
        if not line:
            continue
        kind, qualifier, permissions = line.split(":")
        require(kind in ("user", "group", "mask", "other") and re.fullmatch(r"[r-][w-][x-]", permissions))
        require((kind, qualifier) not in entries)
        entries[kind, qualifier] = permissions
    require(all(key in entries for key in (("user", ""), ("group", ""), ("other", ""))))
    return entries


def engine_supported(version):
    match = re.fullmatch(r"(\d+)\.(\d+)\.(\d+)(?:[-+][A-Za-z0-9.+~-]+)?", version)
    return bool(match and tuple(map(int, match.groups())) >= (26, 0, 0))


def shield_cleanup():
    signal.signal(signal.SIGINT, signal.SIG_IGN)
    signal.signal(signal.SIGTERM, signal.SIG_IGN)


def interrupted(number, _frame):
    global _pending_cancel
    if _cancel_depth:
        _pending_cancel = _pending_cancel or number
        return
    raise SystemExit(128 + number)


@contextmanager
def defer_cancellation():
    global _cancel_depth, _pending_cancel
    _cancel_depth += 1
    try:
        yield
    finally:
        _cancel_depth -= 1
        if not _cancel_depth and _pending_cancel is not None:
            number, _pending_cancel = _pending_cancel, None
            interrupted(number, None)


PRELOAD = r'''require "bundler/setup"
require "rails"
require "dotenv/rails"
require "json"
require "pathname"
require "socket"
require "uri"
cfg = JSON.parse(File.binread(ENV.fetch("DOCUMENSO_LIVE_QA_CONFIG")))
qa_root = File.expand_path(cfg.fetch("operation_root"))
qa_env = File.join(qa_root, "empty.env")
raise "Owned blank dotenv required" unless File.file?(qa_env) && File.size(qa_env).zero?
raise "Ambient credential input refused" if ENV["RAILS_MASTER_KEY"] || ENV["DATABASE_PASSWORD"]
network = JSON.parse(File.binread(File.join(qa_root, "network-proof.json")))
network.fetch("allowed").each do |address, port|
  Socket.tcp(address, port, connect_timeout: 2) { |socket| raise "Loopback probe failed" unless socket.read(8) == "qa-probe" }
end
network.fetch("denied").each do |address, port|
  begin
    Socket.tcp(address, port, connect_timeout: 2) { raise "Nonloopback network allowed" }
  rescue Errno::EPERM, Errno::EACCES, Errno::ENETUNREACH, Errno::ECONNREFUSED, Errno::EHOSTUNREACH
  end
end
Dotenv::Railtie.prepend(Module.new do
  define_method(:dotenv_files) { [qa_env] }
  private :dotenv_files
end)
Dotenv.singleton_class.prepend(Module.new do
  define_method(:load) do |*files, **options|
    raise "Unowned dotenv refused" unless files.any? && files.all? { |file| File.expand_path(file) == qa_env }
    super(*files, **options)
  end
  define_method(:overload) do |*files, **options|
    raise "Unowned dotenv refused" unless files.any? && files.all? { |file| File.expand_path(file) == qa_env }
    super(*files, **options)
  end
end)
require File.join(ENV.fetch("DOCUMENSO_LIVE_APP"), "config/application")
app = Rails.application
absent = File.join(qa_root, "absent-credentials.yml.enc")
key = File.join(qa_root, "absent-master.key")
raise "Credentials must be absent" if File.exist?(absent) || File.exist?(key)
app.config.credentials.content_path = Pathname.new(absent)
app.config.credentials.key_path = Pathname.new(key)
app.config.before_initialize do
  c = Rails.application.config
  c.eager_load = false
  c.action_controller.allow_forgery_protection = true
  c.active_job.queue_adapter = :solid_queue
  c.active_storage.service = :qa_private
  c.active_storage.service_configurations = {"qa_private" => {"service" => "Disk", "root" => cfg.fetch("storage_dir")}}
  c.action_mailer.delivery_method = :smtp
  c.action_mailer.smtp_settings = {address: "127.0.0.1", port: cfg.fetch("miru_smtp_port"), domain: "miru-qa.invalid", enable_starttls_auto: false, open_timeout: 5, read_timeout: 5}
  c.action_mailer.default_url_options = {host: "127.0.0.1", port: URI(cfg.fetch("miru_origin")).port, protocol: "http"}
  c.action_mailer.default_options = {from: "noreply@miru-qa.invalid"}
end
app.config.after_initialize do
  raise "Unexpected QA database" unless Rails.env.test? && ActiveRecord::Base.connection.raw_connection.db == cfg.fetch("database")
  raise "Real worker required" unless ActiveJob::Base.queue_adapter.is_a?(ActiveJob::QueueAdapters::SolidQueueAdapter)
  raise "CSRF must remain enabled" unless ActionController::Base.allow_forgery_protection
  raise "Private storage mismatch" unless ActiveStorage::Blob.service.root.to_s == cfg.fetch("storage_dir")
  mail = ActionMailer::Base.smtp_settings
  raise "Local SMTP required" unless ActionMailer::Base.delivery_method == :smtp && mail[:address] == "127.0.0.1" && mail[:port] == cfg.fetch("miru_smtp_port")
  boot = File.join(qa_root, "control", "boot-#{Process.pid}.json")
  File.open(boot + ".tmp", File::WRONLY | File::CREAT | File::EXCL, 0o600) do |file|
    file.write(JSON.generate(pid: Process.pid, csrf: true, real_solid_queue: true, local_smtp: true, database: cfg.fetch("database")))
  end
  File.rename(boot + ".tmp", boot)
end
DOCUMENSO_LIVE_PREBOOT_VERIFIED = true
'''


class Lifecycle:
    def __init__(self, args):
        self.args = args
        self.work = args.work
        self.state_path = self.work / "state.json"
        self.started = time.monotonic()
        self.last_sample = 0
        self.handles = []
        self.listeners = []
        self.state = {"schema_version": 1, "operation": "miru-live-" + uuid.uuid4().hex[:16], "processes": [], "containers": [], "aliases": [], "chains": [], "relay_acls": []}
        self.state["deadline_epoch"] = time.time() + 1800
        self.op = self.work / self.state["operation"]
        self.setup = self.work / (self.state["operation"] + "-setup")
        self.output = self.work / "evidence"
        self.uid = None
        self.gid = None
        self.runtime_env = None
        self.monitor = False
        self.worker = None
        self.allocated_ports = set()
        self.ephemeral_range = None
        self.phase = "admitted"

    def save(self):
        temporary = self.work / "state.new"
        temporary.write_text(json.dumps(self.state))
        os.chmod(temporary, 0o600)
        os.replace(temporary, self.state_path)

    def docker(self, *args, timeout=30):
        return checked(["docker", *args], timeout=timeout, env={**BASE_ENV, "HOME": str(self.setup)})

    def runtime_prefix(self):
        return ["setpriv", "--reuid", str(self.uid), "--regid", str(self.gid), "--clear-groups", "--no-new-privs", "--inh-caps=-all", "--ambient-caps=-all", "--bounding-set=-all"]

    def start(self, command, name, runtime=False, env=None, cwd=None):
        log = self.setup / "private-logs" / (name + ".log")
        fd = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with defer_cancellation():
            with os.fdopen(fd, "wb") as stream:
                process = subprocess.Popen((self.runtime_prefix() if runtime else []) + command, cwd=cwd,
                                           env=(self.runtime_env if runtime else BASE_ENV) if env is None else env,
                                           stdin=subprocess.DEVNULL, stdout=stream, stderr=stream, start_new_session=True)
            self.handles.append(process)
            identity = process_identity(process.pid)
            require(identity is not None)
            identity["uid"] = self.uid if runtime else 0
            self.state["processes"].append(identity)
            self.save()
        return process

    def tick(self):
        require(time.monotonic() - self.started < 1490, "Reserved cleanup deadline reached")
        require(self.worker is None or self.worker.poll() is None, "Owned SolidQueue process exited")
        if self.monitor and time.monotonic() - self.last_sample >= 2:
            require(mem_available() >= 3 * 1024**3, "Runtime memory reserve below3GiB")
            if self.runtime_env is not None:
                self.check_relays()
            self.inspect_containers(running=True)
            self.last_sample = time.monotonic()

    def wait(self, process, seconds):
        until = time.monotonic() + seconds
        while process.poll() is None:
            self.tick()
            require(time.monotonic() < until, "Owned command deadline reached")
            time.sleep(.2)
        require(process.returncode == 0, "Owned command failed")

    def prepare_user(self):
        require(shutil.which("getfacl", path=BASE_ENV["PATH"]) and shutil.which("setfacl", path=BASE_ENV["PATH"]), "ACL tools required before creating runtime user")
        self.state["setup_uid"] = self.work.stat().st_uid
        self.state["setup_gid"] = pwd.getpwuid(self.state["setup_uid"]).pw_gid
        require(self.state["setup_uid"] != 0 and not self.state_path.exists() and not self.output.exists())
        self.op.mkdir(mode=0o700)
        self.setup.mkdir(mode=0o700)
        (self.setup / "private-logs").mkdir(mode=0o700)
        username = "miruqa" + self.state["operation"].rsplit("-", 1)[1][:10]
        try:
            pwd.getpwnam(username)
        except KeyError:
            pass
        else:
            raise RuntimeError("Operation user already exists")
        self.state.update(username=username, user_absent_before_create=True, operation_root=str(self.op), setup_root=str(self.setup), app_root=str(self.args.app), project=self.state["operation"])
        self.save()
        checked(["useradd", "--system", "--user-group", "--no-create-home", "--home-dir", str(self.op / "home"), "--shell", "/usr/sbin/nologin", username])
        user = pwd.getpwnam(username)
        self.uid, self.gid = user.pw_uid, user.pw_gid
        self.state.update(uid=self.uid, gid=self.gid)
        self.save()
        require(not uid_processes(self.uid), "New account UID already has processes")
        self.state["uid_isolated"] = True
        self.save()
        os.chmod(self.work, 0o711)
        os.chmod(self.op, 0o711)
        for name in ("home", "tmp", "control", "private-downloads", "private-storage", "output"):
            path = self.op / name
            path.mkdir(mode=0o700)
            os.chown(path, self.uid, self.gid)
        (self.op / "browsers").mkdir(mode=0o711)
        for role in ("miru", "provider", "signer"):
            path = self.op / "browsers" / role
            path.mkdir(mode=0o700)
            os.chown(path, self.uid, self.gid)
        # Only the separately checked out public app needs writable build/test files.
        for directory, directories, files in os.walk(self.args.app, followlinks=False):
            for path in [Path(directory), *(Path(directory) / name for name in directories + files)]:
                os.chown(path, self.uid, self.gid, follow_symlinks=False)
        self.protect_relays()
        authority_probe = r'''import errno,os,socket,subprocess
assert os.getuid()!=0 and not os.getgroups()
assert subprocess.run(['sudo','-n','-l'],capture_output=True).returncode!=0
for endpoint in ('/var/run/docker.sock','/run/containerd/containerd.sock'):
 s=socket.socket(socket.AF_UNIX)
 try:
  s.connect(endpoint)
 except OSError as e:
  assert e.errno in (errno.EACCES,errno.ENOENT,errno.ECONNREFUSED),e.errno
 else:
  raise AssertionError('Container API available to runtime')
 finally:
  s.close()
for port in (2375,2376):
 s=socket.socket();s.settimeout(1)
 try:
  s.connect(('127.0.0.1',port))
 except OSError as e:
  assert e.errno==errno.ECONNREFUSED,e.errno
 else:
  raise AssertionError('Container TCP API available to runtime')
 finally:
  s.close()
'''
        checked(self.runtime_prefix() + ["python3", "-I", "-c", authority_probe])
        paths = [self.args.app / "Gemfile", Path(__file__).with_name("documenso_live_provider_spec.rb"), self.args.ruby, self.args.bundle, self.args.node, self.args.pnpm, self.args.brave]
        access = "import os,sys;assert all(os.access(p,os.R_OK) for p in sys.argv[1:]);assert all(os.access(p,os.X_OK) for p in sys.argv[3:])"
        checked(self.runtime_prefix() + ["python3", "-I", "-c", access, *map(str, paths)])
        self.save()

    def protect_relays(self):
        require(not uid_processes(self.uid), "Unix admission must precede untrusted runtime processes")
        listeners = unix_listeners(read_regular(Path("/proc/net/unix"), 2 * 1024**2))
        paths = unix_admission_paths(listeners) | set(RELAY_SOCKETS)
        hosts = next(line for line in read_regular(Path("/etc/nsswitch.conf"), 65536).decode().splitlines() if line.startswith("hosts:"))
        modules = re.sub(r"\[[^]]+\]", "", hosts.split("#", 1)[0].split(":", 1)[1]).split()
        require(set(modules) <= {"files", "dns", "resolve", "myhostname", "mymachines", "mdns", "mdns4", "mdns6", "mdns_minimal", "mdns4_minimal", "mdns6_minimal", "ldap", "wins", "winbind"}, "Unreviewed NSS relay module")
        seen = {(row["device"], row["inode"]) for row in self.state["relay_acls"]}
        for value in sorted(paths):
            path = Path(value)
            if not path.exists():
                continue
            info = path.stat()
            require(stat.S_ISSOCK(info.st_mode))
            identity = (info.st_dev, info.st_ino)
            if identity in seen:
                continue
            seen.add(identity)
            entries = acl_entries(checked(["getfacl", "-cpn", str(path)]))
            key = ("user", str(self.uid))
            require(key not in entries, "Fresh runtime UID already has relay ACL")
            mask = entries.get(("mask", ""), entries["group", ""])
            row = {"path": str(path), "device": info.st_dev, "inode": info.st_ino, "mask": mask, "had_mask": ("mask", "") in entries, "group": entries["group", ""]}
            self.state["relay_acls"].append(row)
            self.save()
            checked(["setfacl", "-n", "-m", f"u:{self.uid}:---,m::{mask}", str(path)])
        self.state["unix_baseline"] = listeners
        self.save()
        self.check_relays()
        probe = "import errno,json,socket,sys;\nfor path,kind in json.load(sys.stdin):\n s=socket.socket(socket.AF_UNIX,kind)\n try:s.connect(path)\n except OSError as e:assert e.errno in (errno.EACCES,errno.ENOENT),e.errno\n else:raise AssertionError('Unix relay accessible')\n finally:s.close()"
        kinds = {address: kind for _, address, kind in listeners}
        checked(self.runtime_prefix() + ["python3", "-I", "-c", probe], input=json.dumps([(path, kinds.get(path, 1)) for path in sorted(paths)]).encode())

    def check_relays(self):
        for _ in range(2):
            before = unix_listeners(read_regular(Path("/proc/net/unix"), 2 * 1024**2))
            owned = owned_unix_inodes(self.state["uid"])
            listeners = unix_listeners(read_regular(Path("/proc/net/unix"), 2 * 1024**2))
            if set(listeners) == set(before):
                break
        unix_isolated(listeners, {tuple(row) for row in self.state.get("unix_baseline", [])}, owned)
        expected = {(row["device"], row["inode"]) for row in self.state["relay_acls"]}
        for value in RELAY_SOCKETS:
            if Path(value).exists():
                info = Path(value).stat()
                require((info.st_dev, info.st_ino) in expected, "New resolver relay socket appeared")
        for row in self.state["relay_acls"]:
            info = Path(row["path"]).stat()
            require((info.st_dev, info.st_ino) == (row["device"], row["inode"]), "Resolver relay inode changed")
            entries = acl_entries(checked(["getfacl", "-cpn", row["path"]]))
            require(entries.get(("user", str(self.state["uid"]))) == "---", "Runtime relay deny ACL changed")

    def qualify_egress(self):
        suffix = int(self.state["operation"][-4:], 16)
        aliases = [(4, f"198.18.{suffix // 256}.{suffix % 256}/32"), (6, f"2001:db8:{suffix:x}::1/128")]
        loopbacks = ["127.0.0.1", "::1"]
        for family, alias in aliases:
            actual = json.loads(checked(["ip", "-j", f"-{family}", "address", "show", "dev", "lo"]))
            address = alias.split("/")[0]
            require(not any(info.get("local") == address for row in actual for info in row.get("addr_info", [])))
            self.state["aliases"].append([family, alias])
            self.save()
            checked(["ip", f"-{family}", "address", "add", alias, "dev", "lo"], timeout=5)
        targets = []
        for address, port in [(address, 0) for address in loopbacks + [alias.split("/")[0] for _, alias in aliases]] + [("127.0.0.2", 53), ("::1", 53)]:
            listener = socket.socket(socket.AF_INET6 if ":" in address else socket.AF_INET)
            listener.bind((address, port or free_port(self.allocated_ports, self.ephemeral_range, address)))
            listener.listen()
            listener.settimeout(.2)
            self.listeners.append(listener)
            targets.append((address, listener.getsockname()[1]))
            threading.Thread(target=self.accept_probe, args=(listener,), daemon=True).start()
        probe = "import socket,sys; s=socket.create_connection((sys.argv[1],int(sys.argv[2])),timeout=2); assert s.recv(16)==b'qa-probe';s.close()"
        for host, port in targets:
            checked(self.runtime_prefix() + ["python3", "-I", "-c", probe, host, str(port)])
        udp_probe = "import socket,sys;s=socket.socket(socket.AF_INET6 if ':' in sys.argv[1] else socket.AF_INET,socket.SOCK_DGRAM);s.settimeout(2);s.connect((sys.argv[1],53));s.send(b'qa-probe');assert s.recv(16)==b'qa-probe';s.close()"
        for host, _ in targets[4:]:
            listener = socket.socket(socket.AF_INET6 if ":" in host else socket.AF_INET, socket.SOCK_DGRAM)
            listener.bind((host, 53))
            listener.settimeout(.2)
            self.listeners.append(listener)
            threading.Thread(target=self.accept_udp_probe, args=(listener,), daemon=True).start()
            checked(self.runtime_prefix() + ["python3", "-I", "-c", udp_probe, host])
        for family in (4, 6):
            tool = "iptables" if family == 4 else "ip6tables"
            chain = "MIRU_" + self.state["operation"][-12:].upper()
            existing = subprocess.run([tool, "-w", "5", "-S", chain], capture_output=True, env=BASE_ENV, timeout=8)
            require(existing.returncode == 1, "Operation firewall chain already exists")
            self.state["chains"].append([tool, chain])
            self.save()
            checked([tool, "-w", "5", "-N", chain], timeout=8)
            for protocol in ("tcp", "udp"):
                checked([tool, "-w", "5", "-A", chain, "-p", protocol, "--dport", "53", "-j", "REJECT", "--reject-with", "icmp-admin-prohibited" if family == 4 else "icmp6-adm-prohibited"])
            ports = sorted(set(self.ports.values()) | {targets[0][1]}) if family == 4 else [targets[1][1]]
            checked([tool, "-w", "5", "-A", chain, "-o", "lo", "-p", "tcp", "-d", "127.0.0.1/32" if family == 4 else "::1/128", "-m", "multiport", "--dports", ",".join(map(str, ports)), "-j", "ACCEPT"])
            checked([tool, "-w", "5", "-A", chain, "-j", "REJECT", "--reject-with", "icmp-admin-prohibited" if family == 4 else "icmp6-adm-prohibited"])
            checked([tool, "-w", "5", "-I", "OUTPUT", "1", "-m", "owner", "--uid-owner", str(self.uid), "-j", chain])
        denial = "import socket,sys;\ntry:\n socket.create_connection((sys.argv[1],int(sys.argv[2])),timeout=2)\nexcept OSError as e:\n assert e.errno in (1,13,101,111,113), e.errno\nelse:\n raise AssertionError('Nonloopback allowed')"
        counters = []
        for index, (host, port) in enumerate(targets):
            if index < 2:
                checked(self.runtime_prefix() + ["python3", "-I", "-c", probe, host, str(port)])
            else:
                family_index = (index - 2) % 2
                before = self.reject_counter(family_index)
                checked(self.runtime_prefix() + ["python3", "-I", "-c", denial, host, str(port)])
                after = self.reject_counter(family_index)
                require(after > before, "OS deny counter did not advance")
                checked(["setpriv", "--reuid", str(self.state["setup_uid"]), "--regid", str(self.state["setup_gid"]), "--clear-groups", "python3", "-I", "-c", probe, host, str(port)])
                counters.append(after - before)
        udp_denial = "import socket,sys;s=socket.socket(socket.AF_INET6 if ':' in sys.argv[1] else socket.AF_INET,socket.SOCK_DGRAM);s.settimeout(2);s.connect((sys.argv[1],53));\ntry:\n s.send(b'qa-probe');s.recv(16)\nexcept OSError as e:assert e.errno in (1,13,101,111,113),e.errno\nelse:raise AssertionError('DNS transport allowed')\nfinally:s.close()"
        for index, (host, _) in enumerate(targets[4:]):
            before = self.reject_counter(index)
            checked(self.runtime_prefix() + ["python3", "-I", "-c", udp_denial, host])
            after = self.reject_counter(index)
            require(after > before, "UDP DNS deny counter did not advance")
            checked(["setpriv", "--reuid", str(self.state["setup_uid"]), "--regid", str(self.state["setup_gid"]), "--clear-groups", "python3", "-I", "-c", udp_probe, host])
            counters.append(after - before)
        self.state["network_qualified"] = True
        self.state["deny_counter_increments"] = counters
        self.network_targets = targets
        private(self.op / "network-proof.json", json.dumps({"allowed": targets[:2], "denied": targets[2:]}), self.uid)
        self.save()

    @staticmethod
    def accept_probe(listener):
        while listener.fileno() >= 0:
            try:
                connection, _ = listener.accept()
                with connection:
                    connection.sendall(b"qa-probe")
            except socket.timeout:
                continue
            except OSError:
                break

    @staticmethod
    def accept_udp_probe(listener):
        while listener.fileno() >= 0:
            try:
                data, sender = listener.recvfrom(16)
                if data == b"qa-probe":
                    listener.sendto(data, sender)
            except socket.timeout:
                continue
            except OSError:
                break

    def reject_counter(self, index):
        tool, chain = self.state["chains"][index]
        lines = checked([tool, "-w", "5", "-n", "-v", "-x", "-L", chain]).decode().splitlines()
        return sum(int(line.split()[0]) for line in lines if len(line.split()) > 2 and line.split()[2] == "REJECT")

    def compose(self, provider_image, source_assets):
        db = "miru_documenso_live_" + self.state["operation"][-12:] + "_test"
        bootstrap, miru_pass, provider_pass, seal_pass = (secrets.token_hex(24) for _ in range(4))
        self.state["database"] = db
        self.ephemeral_range = port_range(read_regular(Path("/proc/sys/net/ipv4/ip_local_port_range"), 128))
        self.ports = {name: free_port(self.allocated_ports, self.ephemeral_range) for name in ("provider", "mailpit", "smtp", "pg", "miru", "cdp-miru", "cdp-provider", "cdp-signer")}
        require(len(set(self.ports.values())) == len(self.ports))
        (self.setup / "pgdata").mkdir(mode=0o700)
        os.chown(self.setup / "pgdata", 70, 70)
        (self.setup / "init").mkdir(mode=0o755)
        sql = f"CREATE ROLE qa_provider LOGIN PASSWORD '{provider_pass}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;\nCREATE DATABASE provider_qa OWNER qa_provider;\nCREATE ROLE qa_miru LOGIN PASSWORD '{miru_pass}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION;\nCREATE DATABASE {db} OWNER qa_miru;\n"
        private(self.setup / "init/001.sql", sql)
        os.chmod(self.setup / "init/001.sql", 0o644)
        private(self.setup / "database.env", f"POSTGRES_USER=qa_bootstrap\nPOSTGRES_PASSWORD={bootstrap}\nPOSTGRES_DB=bootstrap_qa\n")
        private(self.setup / "provider.env", "\n".join(f"{key}={value}" for key, value in {
            "NEXTAUTH_SECRET": secrets.token_hex(32), "NEXT_PRIVATE_ENCRYPTION_KEY": secrets.token_hex(32),
            "NEXT_PRIVATE_ENCRYPTION_SECONDARY_KEY": secrets.token_hex(32),
            "NEXT_PRIVATE_DATABASE_URL": f"postgresql://qa_provider:{provider_pass}@database:5432/provider_qa?schema=public",
            "NEXT_PRIVATE_DIRECT_DATABASE_URL": f"postgresql://qa_provider:{provider_pass}@database:5432/provider_qa?schema=public",
            "NEXT_PRIVATE_SIGNING_PASSPHRASE": seal_pass}.items()) + "\n")
        (self.setup / "seal").mkdir(mode=0o700)
        checked(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", str(self.setup / "seal/key.pem"), "-out", str(self.setup / "seal/cert.crt"), "-days", "2", "-subj", "/CN=Miru Synthetic QA/O=Synthetic QA Only"])
        os.chmod(self.setup / "seal/key.pem", 0o600)
        checked(["openssl", "pkcs12", "-export", "-inkey", str(self.setup / "seal/key.pem"), "-in", str(self.setup / "seal/cert.crt"), "-out", str(self.setup / "seal/cert.p12"), "-passout", "stdin"], input=(seal_pass + "\n").encode())
        public_der = checked(["openssl", "x509", "-in", str(self.setup / "seal/cert.crt"), "-outform", "DER"])
        self.state["public_seal_sha256"] = hashlib.sha256(public_der).hexdigest()
        os.chown(self.setup / "seal/cert.p12", 1001, 1001)
        os.chmod(self.setup / "seal/cert.p12", 0o400)
        site = self.setup / "site"
        site.mkdir(mode=0o755)
        for name, (target, _, _) in SOURCE_ASSETS.items():
            shutil.copyfile(source_assets / name, site / target)
            os.chmod(site / target, 0o644)
        private(site / "index.html", f'<!doctype html><html lang="en"><meta charset="utf-8"><title>Corresponding source</title><p>Exact corresponding source for this QA image. <a href="{SOURCE_RELEASE}">Durable source release</a></p>' + ''.join(f'<p><a href="/source/{target}">{target}</a></p>' for target, _, _ in SOURCE_ASSETS.values()))
        private(site / "embed.html", '<!doctype html><html><body style="margin:0"><iframe id="qa-provider-frame" style="border:0;width:100vw;height:100vh"></iframe></body></html>')
        for name in ("index.html", "embed.html"):
            os.chmod(site / name, 0o644)
        proxy = f'''pid /tmp/nginx.pid;
events {{worker_connections 128;}}
http {{access_log off; error_log /dev/null crit; client_max_body_size 20m; client_body_temp_path /tmp/client; proxy_temp_path /tmp/proxy; fastcgi_temp_path /tmp/fastcgi; uwsgi_temp_path /tmp/uwsgi; scgi_temp_path /tmp/scgi;
server {{listen 8080; location = /source {{alias /qa-source/index.html; default_type text/html; add_header Cache-Control no-store always;}} location /source/ {{alias /qa-source/;}} location = /qa-embed {{alias /qa-source/embed.html; default_type text/html;}} location / {{proxy_pass http://documenso:3000; proxy_set_header Host $http_host; proxy_set_header X-Forwarded-Proto http;}}}}
server {{listen 8081; location / {{proxy_pass http://mailpit:8025; proxy_set_header Host $http_host;}}}}
}}'''
        private(self.setup / "proxy.conf", proxy)
        os.chmod(self.setup / "proxy.conf", 0o644)
        def service(image, memory, cpu, pids, user):
            return {"image": image, "platform": "linux/amd64", "pull_policy": "never", "mem_limit": f"{memory}m", "memswap_limit": f"{memory}m", "cpus": cpu, "pids_limit": pids, "user": user, "read_only": True, "cap_drop": ["ALL"], "security_opt": ["no-new-privileges:true"], "restart": "no", "networks": ["qa_internal"], "dns": ["127.0.0.1"], "logging": {"driver": "none"}, "labels": {"so.miru.qa.operation": self.state["operation"]}, "tmpfs": ["/tmp:rw,nosuid,nodev,noexec,mode=1777,size=128m"]}
        pg = service(IMAGES["database"][0], 512, .5, 128, "70:70")
        pg.update(env_file=[str(self.setup / "database.env")], volumes=[str(self.setup / "pgdata") + ":/var/lib/postgresql/data", str(self.setup / "init") + ":/docker-entrypoint-initdb.d:ro"], ports=[f"127.0.0.1:{self.ports['pg']}:5432"], healthcheck={"test": ["CMD-SHELL", 'pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'], "interval": "2s", "timeout": "2s", "retries": 60})
        pg["tmpfs"].append("/var/run/postgresql:rw,nosuid,nodev,uid=70,gid=70,mode=0775,size=16m")
        provider = service(provider_image, 1536, 1, 256, "1001:1001")
        provider.update(env_file=[str(self.setup / "provider.env")], environment={"PORT": "3000", "NEXT_PUBLIC_WEBAPP_URL": f"http://127.0.0.1:{self.ports['provider']}", "NEXT_PRIVATE_INTERNAL_WEBAPP_URL": "http://documenso:3000", "NEXT_PUBLIC_UPLOAD_TRANSPORT": "database", "NEXT_PRIVATE_JOBS_PROVIDER": "local", "NEXT_PRIVATE_SMTP_TRANSPORT": "smtp-auth", "NEXT_PRIVATE_SMTP_HOST": "mailpit", "NEXT_PRIVATE_SMTP_PORT": "1025", "NEXT_PRIVATE_SMTP_SECURE": "false", "NEXT_PRIVATE_SMTP_FROM_NAME": "Miru Synthetic QA ONLY", "NEXT_PRIVATE_SMTP_FROM_ADDRESS": "noreply@miru-qa.invalid", "NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH": "/opt/documenso/cert.p12"}, volumes=[str(self.setup / "seal/cert.p12") + ":/opt/documenso/cert.p12:ro"], depends_on={"database": {"condition": "service_healthy"}, "mailpit": {"condition": "service_started"}})
        provider["tmpfs"].append("/app/apps/web/.next/cache:rw,nosuid,nodev,uid=1001,gid=1001,mode=0700,size=128m")
        mail = service(IMAGES["mailpit"][0], 128, .25, 64, "1000:1000")
        mail["ports"] = [f"127.0.0.1:{self.ports['smtp']}:1025"]
        proxy_service = service(IMAGES["proxy"][0], 64, .25, 32, "101:101")
        proxy_service.update(entrypoint=["nginx", "-g", "daemon off;"], depends_on=["documenso", "mailpit"], ports=[f"127.0.0.1:{self.ports['provider']}:8080", f"127.0.0.1:{self.ports['mailpit']}:8081"], volumes=[str(self.setup / "proxy.conf") + ":/etc/nginx/nginx.conf:ro", str(site) + ":/qa-source:ro"])
        config = {"name": self.state["project"], "services": {"database": pg, "documenso": provider, "mailpit": mail, "proxy": proxy_service}, "networks": {"qa_internal": {"internal": True, "enable_ipv6": False, "labels": {"so.miru.qa.operation": self.state["operation"]}}}}
        private(self.setup / "compose.json", json.dumps(config))
        self.state["expected_images"] = {"documenso": CONFIG_SHA, **{name: row[1] for name, row in IMAGES.items()}}
        self.save()
        self.db_url = f"postgresql://qa_miru:{miru_pass}@127.0.0.1:{self.ports['pg']}/{db}"

    def compose_command(self, *args):
        return ["docker", "compose", "--project-name", self.state["project"], "--file", str(self.setup / "compose.json"), *args]

    def inspect_containers(self, running=False):
        ids = self.docker("container", "ls", "-aq", "--no-trunc", "--filter", "label=com.docker.compose.project=" + self.state["project"], "--filter", "label=so.miru.qa.operation=" + self.state["operation"]).decode().split()
        require(all(HEX.fullmatch(cid) for cid in ids))
        template = '{"id":{{json .Id}},"image":{{json .Image}},"project":{{json (index .Config.Labels "com.docker.compose.project")}},"operation":{{json (index .Config.Labels "so.miru.qa.operation")}},"service":{{json (index .Config.Labels "com.docker.compose.service")}},"running":{{json .State.Running}},"oom":{{json .State.OOMKilled}},"readonly":{{json .HostConfig.ReadonlyRootfs}},"privileged":{{json .HostConfig.Privileged}},"dns":{{json .HostConfig.Dns}},"memory":{{json .HostConfig.Memory}},"swap":{{json .HostConfig.MemorySwap}},"pids":{{json .HostConfig.PidsLimit}},"cpus":{{json .HostConfig.NanoCpus}},"caps":{{json .HostConfig.CapDrop}},"security":{{json .HostConfig.SecurityOpt}},"user":{{json .Config.User}},"binds":{{json .HostConfig.Binds}},"ports":{{json .NetworkSettings.Ports}},"networks":{{json .NetworkSettings.Networks}}}'
        rows = [json.loads(self.docker("container", "inspect", cid, "--format", template)) for cid in ids]
        contracts = {"database": (512, 500000000, 128, "70:70"), "documenso": (1536, 1000000000, 256, "1001:1001"), "mailpit": (128, 250000000, 64, "1000:1000"), "proxy": (64, 250000000, 32, "101:101")}
        compose = read_json(self.setup / "compose.json")
        for row in rows:
            require(row["project"] == self.state["project"] and row["operation"] == self.state["operation"])
            require(row["image"] == "sha256:" + self.state["expected_images"][row["service"]])
            require(row["readonly"] and not row["privileged"] and row["dns"] == ["127.0.0.1"] and not row["oom"])
            memory, cpu, pids, user = contracts[row["service"]]
            require(row["memory"] == row["swap"] == memory * 1024**2 and row["pids"] == pids and row["cpus"] == cpu and row["user"] == user)
            require(row["caps"] == ["ALL"] and row["security"] == ["no-new-privileges:true"])
            expected_binds = [value if value.count(":") == 2 else value + ":rw" for value in compose["services"][row["service"]].get("volumes", [])]
            require(sorted(row["binds"] or []) == sorted(expected_binds))
            expected_ports = {"database": {"5432/tcp": self.ports["pg"]}, "documenso": {}, "mailpit": {"1025/tcp": self.ports["smtp"]}, "proxy": {"8080/tcp": self.ports["provider"], "8081/tcp": self.ports["mailpit"]}}[row["service"]]
            published = {port: values for port, values in (row["ports"] or {}).items() if values}
            require(published == {port: [{"HostIp": "127.0.0.1", "HostPort": str(host)}] for port, host in expected_ports.items()})
            require(set(row["networks"]) == {self.state["project"] + "_qa_internal"})
            if running:
                require(row["running"], "Owned container exited")
        if self.state["containers"]:
            require(set(ids) == set(self.state["containers"]), "Owned container set changed")
        require(len(rows) == 4 and len({row["service"] for row in rows}) == 4)
        return rows

    def start_services(self):
        process = self.start(self.compose_command("up", "-d", "--pull", "never"), "compose-up")
        self.wait(process, 180)
        rows = self.inspect_containers(running=True)
        self.state["containers"] = [row["id"] for row in rows]
        network = json.loads(self.docker("network", "inspect", self.state["project"] + "_qa_internal", "--format", '{"internal":{{json .Internal}},"operation":{{json (index .Labels "so.miru.qa.operation")}}}'))
        require(network == {"internal": True, "operation": self.state["operation"]})
        self.monitor = True
        self.save()
        samples = []
        until = time.monotonic() + 180
        while len(samples) < 3:
            self.tick()
            try:
                health = local_json(f"http://127.0.0.1:{self.ports['provider']}/api/health")
                require(health.get("status") == "ok" and health.get("database") == "ok" and health.get("certificate") == "ok")
                samples.append(time.monotonic())
            except Exception:
                samples.clear()
            require(time.monotonic() < until, "Provider readiness failed")
            time.sleep(2)
        require(samples[0] < samples[1] < samples[2])
        self.qualify_provider_network()
        self.protect_relays()

    def qualify_provider_network(self):
        provider = next(row["id"] for row in self.inspect_containers(running=True) if row["service"] == "documenso")
        code = r'''const fs=require('node:fs'),net=require('node:net'),dns=require('node:dns').promises;
const targets=JSON.parse(process.argv[1]);
async function refused([host,port]) {await new Promise((resolve,reject)=>{const s=net.connect({host,port});s.setTimeout(2000,()=>{s.destroy();reject(Error('Timeout is not denial'))});s.on('connect',()=>{s.destroy();reject(Error('Outside listener reachable'))});s.on('error',e=>{if(['ENETUNREACH','EHOSTUNREACH','EACCES','EPERM','ECONNREFUSED'].includes(e.code))resolve();else reject(e)})})}
(async()=>{if(process.getuid()!==1001)throw Error('Provider UID');
if(fs.readFileSync('/proc/net/route','utf8').split('\n').slice(1).some(x=>x.trim().split(/\s+/)[1]==='00000000'))throw Error('Default route');
await dns.lookup('database');for(const target of targets)await refused(target);
console.log(JSON.stringify({uid:1001,no_default_route:true,internal_dns:true,outside_refused:true}))})().catch(()=>process.exit(1));'''
        row = json.loads(self.docker("exec", "--user", "1001:1001", provider, "node", "-e", code, json.dumps(self.network_targets[2:4]), timeout=12))
        require(row == {"uid": 1001, "no_default_route": True, "internal_dns": True, "outside_refused": True})
        self.state["provider_network_qualified"] = True
        self.save()

    def runtime_config(self, diff_ids):
        config = {"schema_version": 1, "operation_root": str(self.op), "admission_path": str(self.op / "admission.json"), "admission_sha256": "", "miru_origin": f"http://127.0.0.1:{self.ports['miru']}", "provider_origin": f"http://127.0.0.1:{self.ports['provider']}", "mailpit_origin": f"http://127.0.0.1:{self.ports['mailpit']}", "miru_smtp_port": self.ports["smtp"], "database": self.state["database"], "storage_dir": str(self.op / "private-storage"), "output_dir": str(self.op / "output"), "identities": {role: {"name": "Synthetic " + role.title(), "email": role + "@miru-qa.invalid", **({"password": secrets.token_urlsafe(24)} if role != "signer" else {})} for role in ("miru", "provider", "signer")}, "browsers": [], "source_assets": [{"url": f"http://127.0.0.1:{self.ports['provider']}/source/{target}", "sha256": sha, "bytes": size} for target, size, sha in SOURCE_ASSETS.values()]}
        private(self.op / "qa-config.json", json.dumps(config), self.uid)
        private(self.op / "empty.env", "", self.uid)
        private(self.op / "runtime_preload.rb", PRELOAD, self.uid)
        private(self.op / "queue.yml", "test:\n  dispatchers:\n    - polling_interval: 0.1\n      batch_size: 100\n  workers:\n    - queues: '*'\n      threads: 2\n      processes: 1\n      polling_interval: 0.1\n", self.uid)
        paths = list(dict.fromkeys(str(path.parent) for path in (self.args.ruby, self.args.bundle, self.args.node, self.args.pnpm)))
        self.runtime_env = {**BASE_ENV, "PATH": ":".join(paths + BASE_ENV["PATH"].split(":")), "HOME": str(self.op / "home"), "TMPDIR": str(self.op / "tmp"), "CI": "true", "RAILS_ENV": "test", "DATABASE_URL": self.db_url, "BUNDLE_GEMFILE": str(self.args.app / "Gemfile"), "DISABLE_BOOTSNAP": "1", "SKIP_VITE_TEST_BUILD": "1", "VITE_RUBY_AUTO_BUILD": "false", "RUBYOPT": "-r" + str(self.op / "runtime_preload.rb"), "SOLID_QUEUE_CONFIG": str(self.op / "queue.yml"), "DOCUMENSO_ORIGIN": config["provider_origin"], "DOCUMENSO_SEAL_SHA256": self.state["public_seal_sha256"], "DOCUMENSO_LIVE_APP": str(self.args.app), "DOCUMENSO_LIVE_QA_CONFIG": str(self.op / "qa-config.json"), "EMAIL_DELIVERY_METHOD": "smtp", "MIRU_PAYROLL_ENABLED": "false", "SECRET_KEY_BASE": secrets.token_hex(64)}
        self.wait(self.start([str(self.args.bundle), "exec", str(self.args.ruby), str(self.args.app / "bin/rails"), "db:schema:load"], "schema", runtime=True, cwd=self.args.app), 180)
        self.wait(self.start(["timeout", "180", str(self.args.app / "bin/vite"), "build"], "assets", runtime=True, cwd=self.args.app), 190)
        worker_gate = r'''import json,os,pathlib,stat,sys,time
marker=pathlib.Path(sys.argv[1]);database=sys.argv[2];deadline=float(sys.argv[3])
while not marker.exists():
 assert time.time()<deadline,'Database readiness deadline reached'
 time.sleep(.1)
assert not marker.is_symlink() and marker.stat().st_uid==os.getuid() and stat.S_IMODE(marker.stat().st_mode)==0o600 and marker.stat().st_size<=4096
assert json.loads(marker.read_bytes())=={'schema_version':1,'database':database,'ready':True}
os.execve(sys.argv[4],sys.argv[4:],os.environ)
'''
        worker = self.start(["python3", "-I", "-c", worker_gate, str(self.op / "control/rspec-database-ready.json"), self.state["database"], str(self.state["deadline_epoch"] - 300), str(self.args.bundle), "exec", "rake", "solid_queue:start"], "solid-queue", runtime=True, cwd=self.args.app)
        self.worker = worker
        self.start_browsers(config)
        # os_loopback_only records the INET firewall gate; Unix IPC uses host admission/monitoring, not an immutable namespace.
        admission = {"schema_version": 1, "operation_root": str(self.op), "miru_head": HEAD, "database": self.state["database"], "storage_dir": str(self.op / "private-storage"), "image": {"config_sha256": CONFIG_SHA, "platform": "linux/amd64", "rootfs_verified": True, "diff_ids": diff_ids}, "guards": {key: True for key in ("blank_dotenv", "credentials_absent", "os_loopback_only", "csrf", "real_solid_queue", "local_smtp", "normal_brave")}, "worker_pid": worker.pid, "deadline_epoch": self.state["deadline_epoch"]}
        private(self.op / "admission.json", json.dumps(admission), self.uid)
        config["admission_sha256"] = digest(self.op / "admission.json")
        private(self.op / "qa-config.new", json.dumps(config), self.uid)
        os.replace(self.op / "qa-config.new", self.op / "qa-config.json")
        spec = Path(__file__).resolve().with_name("documenso_live_provider_spec.rb")
        require(spec.is_file())
        self.wait(self.start([str(self.args.bundle), "exec", "rspec", str(spec), "--format", "progress"], "functional", runtime=True, cwd=self.args.app), max(1, 1500 - int(time.monotonic() - self.started)))

    def start_browsers(self, config):
        package = checked(["dpkg-query", "-W", "-f", "${Package} ${Status} ${Version}\n", "brave-browser"]).decode()
        require(package.startswith("brave-browser install ok installed "))
        require(self.args.brave == Path("/usr/bin/brave-browser") and os.access(self.args.brave, os.X_OK))
        for role in ("miru", "provider", "signer"):
            profile = self.op / "browsers" / role
            port = self.ports["cdp-" + role]
            flags = ["--headless=new", "--no-startup-window", "--no-first-run", "--no-default-browser-check", "--disable-background-networking", "--disable-sync", "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=" + str(port), "--user-data-dir=" + str(profile)]
            require(not any(bad in flag for bad in FORBIDDEN_FLAGS for flag in flags))
            process = self.start([str(self.args.brave), *flags], "brave-" + role, runtime=True)
            until = time.monotonic() + 20
            discover = r'''import json,sys,urllib.request
port=int(sys.argv[1]);assert 0<port<65536
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
with opener.open('http://127.0.0.1:'+str(port)+'/json/version',timeout=3) as response:
 value=json.loads(response.read(65537))
assert value['webSocketDebuggerUrl'].startswith('ws://127.0.0.1:'+str(port)+'/')
print('ready')
'''
            while True:
                self.tick()
                require(process.poll() is None and time.monotonic() < until, "Normal Brave sandbox startup failed")
                try:
                    checked(self.runtime_prefix() + ["python3", "-I", "-c", discover, str(port)], timeout=5)
                    break
                except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
                    time.sleep(.1)
            argv = Path(f"/proc/{process.pid}/cmdline").read_bytes().decode().split("\0")[:-1]
            require(process_identity(process.pid)["uid"] == self.uid and not any(bad in value for value in argv for bad in FORBIDDEN_FLAGS))
            require("--user-data-dir=" + str(profile) in argv)
            config["browsers"].append({"role": role, "cdp_url": f"http://127.0.0.1:{port}", "pid": process.pid, "profile_dir": str(profile), "argv": argv})

    def cleanup(self):
        for listener in self.listeners:
            listener.close()
        errors = []
        for process in self.handles:
            if process.poll() is None:
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
        for identity in reversed(self.state.get("processes", [])):
            try:
                actual = process_identity(identity["pid"])
                if actual and actual["start"] == identity["start"] and actual["uid"] in (0, identity["uid"]):
                    os.killpg(identity["pid"], signal.SIGTERM)
            except ProcessLookupError:
                pass
            except Exception:
                errors.append("process_cleanup")
        until = time.monotonic() + 8
        while time.monotonic() < until and any(process.poll() is None for process in self.handles):
            time.sleep(.1)
        for process in self.handles:
            if process.poll() is None:
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
        for identity in reversed(self.state.get("processes", [])):
            try:
                actual = process_identity(identity["pid"])
                if actual and actual["start"] == identity["start"] and actual["uid"] in (0, identity["uid"]):
                    os.killpg(identity["pid"], signal.SIGKILL)
            except ProcessLookupError:
                pass
            except Exception:
                errors.append("process_cleanup")
        until = time.monotonic() + 3
        while time.monotonic() < until:
            statuses = [process.poll() for process in self.handles]
            if all(status is not None for status in statuses):
                break
            time.sleep(.1)
        if any(process.poll() is None for process in self.handles):
            errors.append("process_cleanup")
        runtime_remaining = []
        if self.state.get("uid_isolated"):
            for entry in Path("/proc").iterdir():
                if not entry.name.isdigit():
                    continue
                try:
                    identity = process_identity(int(entry.name))
                    if identity and identity["uid"] == self.state["uid"]:
                        os.kill(identity["pid"], signal.SIGKILL)
                        runtime_remaining.append(identity)
                except (FileNotFoundError, ProcessLookupError):
                    pass
            until = time.monotonic() + 3
            while time.monotonic() < until:
                remaining = uid_processes(self.state["uid"])
                if not remaining:
                    break
                for row in remaining:
                    try:
                        os.kill(row["pid"], signal.SIGKILL)
                    except ProcessLookupError:
                        pass
                for process in self.handles:
                    process.poll()
                time.sleep(.1)
            runtime_remaining = uid_processes(self.state["uid"])
            if runtime_remaining:
                errors.append("runtime_process_cleanup")
        for row in ([] if runtime_remaining else reversed(self.state.get("relay_acls", []))):
            if row.get("restored") is True:
                continue
            try:
                path = Path(row["path"])
                require(path.exists(), "Protected relay path unavailable during cleanup")
                info = path.stat()
                require((info.st_dev, info.st_ino) == (row["device"], row["inode"]), "Relay changed during cleanup")
                entries = acl_entries(checked(["getfacl", "-cpn", str(path)], timeout=5))
                key = ("user", str(self.state["uid"]))
                if key in entries:
                    require(entries[key] == "---", "Owned deny ACL changed; preserve newer entry")
                    checked(["setfacl", "-n", "-x", "u:" + str(self.state["uid"]), str(path)], timeout=5)
                    entries = acl_entries(checked(["getfacl", "-cpn", str(path)], timeout=5))
                    require(key not in entries)
                named = any(qualifier for kind, qualifier in entries if kind in ("user", "group"))
                if not row["had_mask"] and not named and entries.get(("mask", "")) == row["mask"] and entries["group", ""] == row["group"]:
                    checked(["setfacl", "-n", "-x", "m", str(path)], timeout=5)
                    entries = acl_entries(checked(["getfacl", "-cpn", str(path)], timeout=5))
                    require(("mask", "") not in entries and key not in entries and entries["group", ""] == row["group"])
                row["restored"] = True
                try:
                    self.save()
                except BaseException:
                    row.pop("restored", None)
                    raise
            except Exception:
                errors.append("relay_acl_cleanup")
        if any(row.get("restored") is not True for row in self.state.get("relay_acls", [])):
            self.state.update(cleanup_errors=errors, runtime_processes_stopped=bool(self.state.get("uid_isolated") and not runtime_remaining), cleanup_complete=False)
            self.save()
            return False
        if self.state.get("project") and self.state.get("expected_images"):
            try:
                ids = self.docker("container", "ls", "-aq", "--no-trunc", "--filter", "label=com.docker.compose.project=" + self.state["project"], "--filter", "label=so.miru.qa.operation=" + self.state["operation"]).decode().split()
                for cid in ids:
                    require(HEX.fullmatch(cid))
                    row = json.loads(self.docker("container", "inspect", cid, "--format", '{"image":{{json .Image}},"operation":{{json (index .Config.Labels "so.miru.qa.operation")}},"project":{{json (index .Config.Labels "com.docker.compose.project")}},"service":{{json (index .Config.Labels "com.docker.compose.service")}}}'))
                    require(row["project"] == self.state["project"] and row["operation"] == self.state["operation"] and row["image"] == "sha256:" + self.state["expected_images"][row["service"]])
                    self.docker("container", "stop", "--time", "10", cid, timeout=20)
                    self.docker("container", "rm", cid, timeout=5)
                networks = self.docker("network", "ls", "-q", "--filter", "label=com.docker.compose.project=" + self.state["project"], "--filter", "label=so.miru.qa.operation=" + self.state["operation"]).decode().split()
                for network in networks:
                    self.docker("network", "rm", network, timeout=5)
                require(not self.docker("container", "ls", "-aq", "--filter", "label=com.docker.compose.project=" + self.state["project"], "--filter", "label=so.miru.qa.operation=" + self.state["operation"]).strip())
                require(not self.docker("network", "ls", "-q", "--filter", "label=com.docker.compose.project=" + self.state["project"], "--filter", "label=so.miru.qa.operation=" + self.state["operation"]).strip())
            except Exception:
                errors.append("compose_cleanup")
        for tool, chain in ([] if runtime_remaining else reversed(self.state.get("chains", []))):
            present = subprocess.run([tool, "-w", "5", "-S", chain], capture_output=True, env=BASE_ENV, timeout=8)
            if present.returncode == 1:
                continue
            if present.returncode:
                errors.append("firewall_cleanup")
                continue
            for args in (["-D", "OUTPUT", "-m", "owner", "--uid-owner", str(self.state["uid"]), "-j", chain], ["-F", chain], ["-X", chain]):
                try:
                    checked([tool, "-w", "5", *args], timeout=8)
                except subprocess.CalledProcessError:
                    if args[0] != "-D":
                        errors.append("firewall_cleanup")
            absent = subprocess.run([tool, "-w", "5", "-S", chain], capture_output=True, env=BASE_ENV, timeout=8)
            if absent.returncode != 1:
                errors.append("firewall_cleanup")
        for family, alias in ([] if runtime_remaining else reversed(self.state.get("aliases", []))):
            try:
                rows = json.loads(checked(["ip", "-j", f"-{family}", "address", "show", "dev", "lo"], timeout=5))
                if any(item.get("local") == alias.split("/")[0] for row in rows for item in row.get("addr_info", [])):
                    checked(["ip", f"-{family}", "address", "del", alias, "dev", "lo"], timeout=5)
                remaining = json.loads(checked(["ip", "-j", f"-{family}", "address", "show", "dev", "lo"], timeout=5))
                require(not any(item.get("local") == alias.split("/")[0] for row in remaining for item in row.get("addr_info", [])))
            except Exception:
                errors.append("alias_cleanup")
        if self.state.get("uid_isolated") and not runtime_remaining:
            try:
                app = Path(self.state["app_root"])
                require(app == Path(os.environ["GITHUB_WORKSPACE"]) / "qa-public-miru" and not app.is_symlink())
                for directory, directories, files in os.walk(app, followlinks=False):
                    for path in [Path(directory), *(Path(directory) / name for name in directories + files)]:
                        if path.lstat().st_uid == self.state["uid"]:
                            os.chown(path, self.state["setup_uid"], self.state["setup_gid"], follow_symlinks=False)
            except Exception:
                errors.append("checkout_ownership_cleanup")
        if self.state.get("username") and not runtime_remaining:
            try:
                user = pwd.getpwnam(self.state["username"])
                require(user.pw_dir == str(self.op / "home") and user.pw_shell == "/usr/sbin/nologin" and self.state.get("user_absent_before_create"))
                require("uid" not in self.state or user.pw_uid == self.state["uid"])
                self.state.update(uid=user.pw_uid, gid=user.pw_gid)
                checked(["userdel", self.state["username"]], timeout=5)
                try:
                    group = grp.getgrnam(self.state["username"])
                    require(group.gr_gid == self.state["gid"] and not group.gr_mem)
                    checked(["groupdel", group.gr_name], timeout=5)
                except KeyError:
                    pass
                try:
                    pwd.getpwnam(self.state["username"])
                except KeyError:
                    pass
                else:
                    raise RuntimeError("Owned user still exists")
            except KeyError:
                pass
            except Exception:
                errors.append("user_cleanup")
        self.state["cleanup_errors"] = errors
        self.state["runtime_processes_stopped"] = bool(self.state.get("uid_isolated") and not runtime_remaining)
        self.state["cleanup_complete"] = not errors
        self.save()
        return not errors

    def export_evidence(self, passed):
        self.output.mkdir(mode=0o700, exist_ok=True)
        allowed = SCREENSHOTS | {"summary.json", "safe-events.jsonl"}
        source = self.op / "output"
        receipt = {"schema_version": 1, "passed": False, "phase": self.phase, "image_config_sha256": CONFIG_SHA, "source_head": HEAD, "artifact_id": ARTIFACT_ID, "rootfs_verified": self.state.get("artifact_verified", False), "layers": 23 if self.state.get("artifact_verified") else 0, "image_import_verified": self.state.get("image_import_verified", False), "os_egress_qualified": self.state.get("network_qualified", False), "provider_network_qualified": self.state.get("provider_network_qualified", False), "engine_version": self.state.get("engine_version"), "deny_counter_increments": self.state.get("deny_counter_increments", []), "cleanup_complete": self.state.get("cleanup_complete", False), "cleanup_errors": self.state.get("cleanup_errors", []), "evidence_rejections": [], "dependencies": {name: {"reference": row[0], "config_sha256": row[1], "version": row[2], "index_digest": row[3]} for name, row in IMAGES.items()}}
        receipt["transport"] = {"release_id": RELEASE_ID, "tag": QA_TAG, "image_asset_id": IMAGE_ASSET_ID,
                                "manifest_asset_id": MANIFEST_ASSET_ID, "manifest_sha256": TRANSPORT_MANIFEST_SHA,
                                "verified": self.state.get("artifact_verified", False)}
        private(self.output / "lifecycle.first", json.dumps(receipt))
        os.replace(self.output / "lifecycle.first", self.output / "lifecycle.json")
        runtime_safe = "uid" in self.state and self.state.get("cleanup_complete") and self.state.get("runtime_processes_stopped") and not uid_processes(self.state["uid"])
        if not runtime_safe:
            receipt["evidence_rejections"].append("runtime_cleanup_incomplete")
        copied = set()
        for path in source.rglob("*"):
            if not runtime_safe:
                break
            if path.is_dir() and not path.is_symlink():
                continue
            relative = path.relative_to(source).as_posix()
            try:
                require(relative in allowed, "Unexpected evidence output refused")
                data = read_regular(path, 10 * 1024**2)
                if relative.endswith(".png"):
                    validate_png_bytes(data)
                elif relative == "safe-events.jsonl":
                    for line in data.splitlines():
                        event = json.loads(line, object_pairs_hook=unique_object)
                        require(set(event) <= {"schema_version", "phase", "packet", "passed"} and event.get("schema_version") == 1 and event.get("phase") in PHASES and event.get("passed") is True)
                        require("packet" not in event or event["packet"] in ("client", "consultant"))
                else:
                    validate_summary(json.loads(data, object_pairs_hook=unique_object))
                target = self.output / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                private(target, data)
                copied.add(relative)
            except Exception:
                receipt["evidence_rejections"].append("invalid_output")
        if passed and "summary.json" not in copied:
            receipt["evidence_rejections"].append("missing_summary")
        receipt["passed"] = bool(passed and not receipt["evidence_rejections"])
        private(self.output / "lifecycle.new", json.dumps(receipt))
        os.replace(self.output / "lifecycle.new", self.output / "lifecycle.json")
        for path in [self.output, *self.output.rglob("*")]:
            os.chown(path, self.state["setup_uid"], -1)
        return not receipt["evidence_rejections"]


def validate_png(path):
    validate_png_bytes(read_regular(path, 10 * 1024**2))


def validate_png_bytes(data):
    with io.BytesIO(data) as stream:
        require(stream.read(8) == b"\x89PNG\r\n\x1a\n")
        seen = []
        while True:
            raw = stream.read(4)
            require(len(raw) == 4)
            length = int.from_bytes(raw, "big")
            kind = stream.read(4)
            require(kind in (b"IHDR", b"pHYs", b"IDAT", b"IEND") and length <= 10 * 1024**2)
            data, checksum = stream.read(length), stream.read(4)
            require(len(data) == length and len(checksum) == 4 and zlib.crc32(kind + data) == int.from_bytes(checksum, "big"))
            if kind == b"pHYs":
                require(length == 9 and data[8] in (0, 1) and b"IDAT" not in seen and b"pHYs" not in seen)
            seen.append(kind)
            if kind == b"IEND":
                require(length == 0 and stream.read(1) == b"")
                break
        require(seen[0] == b"IHDR" and seen.count(b"IHDR") == 1 and b"IDAT" in seen)


def validate_summary(value):
    require(isinstance(value, dict) and set(value) <= {"schema_version", "passed", "phase", "image_config_sha256", "source_assets_verified", "console_errors", "packets", "error_class"})
    require(value.get("schema_version") == 1 and type(value.get("passed")) is bool and value.get("phase") in PHASES and value.get("image_config_sha256") == CONFIG_SHA)
    require(type(value.get("source_assets_verified")) is int and 0 <= value["source_assets_verified"] <= 3 and type(value.get("console_errors")) is int and value["console_errors"] >= 0)
    if "error_class" in value:
        require(re.fullmatch(r"[A-Za-z][A-Za-z0-9_:]{0,100}", value["error_class"]))
    require(isinstance(value.get("packets"), list) and len(value["packets"]) <= 2)
    for packet in value["packets"]:
        require(set(packet) == {"kind", "version", "documents", "fields", "signers", "artifact_checks", "share_sha256", "denials"})
        require(packet["kind"] in ("client", "consultant") and type(packet["version"]) is int and packet["documents"] == 2 and packet["fields"] == 10 and packet["signers"] == 2 and HEX.fullmatch(packet["share_sha256"]))
        require(isinstance(packet["artifact_checks"], list) and len(packet["artifact_checks"]) == 8)
        for width in (1440, 375):
            require(sorted(item["kind"] for item in packet["artifact_checks"] if item["viewport"] == width) == ["audit_log", "certificate", "signed", "signed"])
        for item in packet["artifact_checks"]:
            require(set(item) == {"kind", "sha256", "bytes", "pages", "viewport", "pdf_signature_valid", "body_preserved"})
            require(item["kind"] in ("signed", "certificate", "audit_log") and HEX.fullmatch(item["sha256"]) and type(item["bytes"]) is int and 0 < item["bytes"] <= 20 * 1024**2 and type(item["pages"]) is int and item["pages"] > 0 and item["viewport"] in (1440, 375) and type(item["pdf_signature_valid"]) is bool and type(item["body_preserved"]) is bool)
            require(item["pdf_signature_valid"] == (item["kind"] == "signed") and item["body_preserved"] == (item["kind"] == "signed"))
        require(len(packet["denials"]) == 4 and {item["actor"] for item in packet["denials"]} == {"anonymous", "unassigned_employee", "other_workspace", "stale_workspace"})
        for item in packet["denials"]:
            require(set(item) == {"actor", "statuses", "pdf_bytes_served"} and item["actor"] in ("anonymous", "unassigned_employee", "other_workspace", "stale_workspace") and item["pdf_bytes_served"] is False)
            require(isinstance(item["statuses"], list) and all(type(status) is int and 100 <= status <= 599 for status in item["statuses"]))
            require(item["statuses"] == [{"anonymous": 401, "unassigned_employee": 404, "other_workspace": 404, "stale_workspace": 409}[item["actor"]]] * 4)
    if value["passed"]:
        require(value["phase"] == "complete" and value["source_assets_verified"] == 3 and value["console_errors"] == 0)
        require(len(value["packets"]) == 2 and {packet["kind"] for packet in value["packets"]} == {"client", "consultant"})


def parse_args(argv):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-check", action="store_true")
    parser.add_argument("--cleanup", action="store_true")
    for name in ("app", "work", "artifact", "source", "ruby", "bundle", "node", "pnpm", "brave"):
        parser.add_argument("--" + name, type=Path)
    args = parser.parse_args(argv)
    if not args.self_check:
        require(args.work is not None and args.work.is_absolute() and not args.work.is_symlink())
        require(args.work == Path(os.environ["RUNNER_TEMP"]) / "miru-documenso-live")
        if not args.cleanup:
            require(all(getattr(args, name) is not None and getattr(args, name).is_absolute() for name in ("app", "artifact", "source", "ruby", "bundle", "node", "pnpm", "brave")))
            require(args.app == Path(os.environ["GITHUB_WORKSPACE"]) / "qa-public-miru" and not args.app.is_symlink())
            require(args.artifact.name == IMAGE_ASSET_NAME)
            for name in ("ruby", "bundle", "node", "pnpm", "brave"):
                require(getattr(args, name).is_file() and os.access(getattr(args, name), os.X_OK))
    return args


def self_check():
    require(__debug__, "Assertions required")
    with tempfile.TemporaryDirectory() as directory:
        root = Path(directory)
        path = root / "safe.json"
        private(path, '{"schema_version":1}')
        assert read_json(path) == {"schema_version": 1} and stat.S_IMODE(path.stat().st_mode) == 0o600
        link = root / "untrusted-link"
        link.symlink_to(path)
        try:
            read_regular(link, 1024)
        except OSError:
            pass
        else:
            raise AssertionError("Evidence symlink followed")
        readable = root / "readonly-config"
        private(readable, "synthetic", os.getuid())
        assert readable.stat().st_uid == os.geteuid() and stat.S_IMODE(readable.stat().st_mode) == 0o640
        for raw in ('{"a":1,"a":2}', '[]'):
            path.write_text(raw)
            try:
                result = read_json(path)
                require(isinstance(result, dict))
            except (RuntimeError, ValueError):
                pass
            else:
                raise AssertionError("Malformed metadata accepted")
        bad = root / "image.tar"
        import io
        for name in ("../bad", "/absolute", "a/../b", "a\\b"):
            with tarfile.open(bad, "w") as archive:
                member = tarfile.TarInfo(name)
                member.size = 1
                archive.addfile(member, io.BytesIO(b"x"))
            try:
                with tarfile.open(bad) as archive:
                    safe_tar_members(archive)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unsafe archive path accepted")
        for kind in (tarfile.SYMTYPE, tarfile.LNKTYPE):
            with tarfile.open(bad, "w") as archive:
                member = tarfile.TarInfo("link")
                member.type, member.linkname = kind, "outside"
                archive.addfile(member)
            try:
                with tarfile.open(bad) as archive:
                    safe_tar_members(archive)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Archive link accepted")
        def png_chunk(kind, data):
            return len(data).to_bytes(4, "big") + kind + data + zlib.crc32(kind + data).to_bytes(4, "big")
        image = root / "safe.png"
        pixels = png_chunk(b"IDAT", zlib.compress(b"\x00\x00\x00\x00"))
        header = png_chunk(b"IHDR", bytes.fromhex("00000001000000010802000000"))
        image.write_bytes(b"\x89PNG\r\n\x1a\n" + header + pixels + png_chunk(b"IEND", b""))
        validate_png(image)
        valid = b"\x89PNG\r\n\x1a\n" + header + png_chunk(b"pHYs", b"\x00\x00\x0e\xc4\x00\x00\x0e\xc4\x01") + pixels + png_chunk(b"IEND", b"")
        validate_png_bytes(valid)
        for physical in (b"too short", b"\x00" * 8 + b"\x02", b"\x00" * 10):
            try:
                validate_png_bytes(b"\x89PNG\r\n\x1a\n" + header + png_chunk(b"pHYs", physical) + pixels + png_chunk(b"IEND", b""))
            except RuntimeError:
                pass
            else:
                raise AssertionError("Invalid pHYs accepted")
        image.write_bytes(b"\x89PNG\r\n\x1a\n" + header + png_chunk(b"tEXt", b"private") + pixels + png_chunk(b"IEND", b""))
        try:
            validate_png(image)
        except RuntimeError:
            pass
        else:
            raise AssertionError("PNG metadata accepted")
        base = {"schema_version": 1, "passed": False, "phase": "admitted", "image_config_sha256": CONFIG_SHA, "source_assets_verified": 0, "console_errors": 0, "packets": []}
        validate_summary(base)
        for changed in ({**base, "url": "forbidden"}, {**base, "error_class": "https://forbidden"}, {**base, "phase": "untrusted"}, {**base, "passed": True}):
            try:
                validate_summary(changed)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unsafe evidence accepted")
        assert len(IMAGES) == 3 and len(SOURCE_ASSETS) == 3 and all("@sha256:" in value[0] for value in IMAGES.values())
        assert "Acquire::Retries" not in PRELOAD and "perform_now" not in PRELOAD and "test_adapter" not in PRELOAD
        assert engine_supported("26.0.0") and engine_supported("28.5.2") and not engine_supported("25.0.5") and not engine_supported("unknown")
        entries = acl_entries(b"user::rw-\nuser:901:---\ngroup::rw-\nmask::rw-\nother::rw-\n")
        assert entries["user", "901"] == "---" and entries["mask", ""] == entries["group", ""]
        # Validate and copy the same snapshot even if the path changes afterwards.
        from unittest.mock import Mock, patch
        def diagnostic(error):
            output = io.StringIO()
            with patch.object(sys, "stderr", output):
                report_failure(error)
            return output.getvalue()
        foreign = compile("raise RuntimeError('SYNTHETIC_SECRET https://private.invalid/token')", "/foreign/SYNTHETIC_SECRET/documenso_functional_qa.py", "exec")
        try:
            expected_line = sys._getframe().f_lineno + 1
            exec(foreign)
        except RuntimeError as error:
            assert diagnostic(error) == f"Functional QA refused or failed (RuntimeError, adapter_line={expected_line}); only sanitized evidence may be uploaded\n"
        try:
            expected_line = sys._getframe().f_lineno + 1
            require(False, "SYNTHETIC_SECRET")
        except RuntimeError as error:
            assert diagnostic(error) == f"Functional QA refused or failed (RuntimeError, adapter_line={expected_line}); only sanitized evidence may be uploaded\n"
        private_error = type("SYNTHETIC_SECRET_CLASS", (Exception,), {})
        assert diagnostic(private_error("SYNTHETIC_SECRET")) == "Functional QA refused or failed (Exception, adapter_line=0); only sanitized evidence may be uploaded\n"
        runner, workspace = root / "runner", root / "workspace"
        binaries = root / "bin"
        binaries.mkdir()
        argv = ["--app", str(workspace / "qa-public-miru"), "--work", str(runner / "miru-documenso-live"),
                "--artifact", str(runner / "documenso-inputs" / IMAGE_ASSET_NAME),
                "--source", str(runner / "documenso-inputs/source")]
        for name in ("ruby", "bundle", "node", "pnpm", "brave"):
            binary = binaries / ("brave-browser" if name == "brave" else name)
            binary.write_bytes(b"synthetic parser fixture; never executed")
            binary.chmod(0o700)
            argv.extend(("--" + name, str(binary)))
        with patch.dict(os.environ, {"RUNNER_TEMP": str(runner), "GITHUB_WORKSPACE": str(workspace)}, clear=True):
            assert parse_args(argv).artifact == runner / "documenso-inputs" / IMAGE_ASSET_NAME
            old_name = list(argv)
            old_name[old_name.index("--artifact") + 1] = str(runner / "documenso-inputs/provider.complete.zip")
            try:
                parse_args(old_name)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Historical transport filename accepted")
        transport = root / "transport"
        transport.mkdir()
        admission = b'''{
  "schema_version": 1,
  "purpose": "Durable transport of the same re-verified historical QA image; not a new build, functional acceptance or production deployment",
  "original_artifact": {"id": 13822868908, "availability": "GitHub API returned 404 on 2026-11-16; original artifact is not used as a fresh download", "historically_recorded_api_digest": "sha256:a3f905b026083cb8c4e8e261dae4e3642919a4f1376d44375e6b6b2ad5767590", "historically_recorded_api_size": 450162450},
  "qa_release": {"tag": "documenso-qa-4aa6ff574-20261116", "target_commit": "4aa6ff5744267b1942bbf614fac322c8c1184bf7", "prerelease": true, "latest": false},
  "original_build": {"repository": "saeloun/miru-web", "run_id": 42946388869, "attempt": 1, "head": "4aa6ff5744267b1942bbf614fac322c8c1184bf7", "checkout": "3e26e7ba9574b552b0c21dbb417e2135b01ec1a5", "workflow": ".github/workflows/documenso-build.yml", "status": "completed", "conclusion": "success"},
  "image_asset": {"name": "documenso-8707e33-image-4aa6ff574-amd64.zip", "bytes": 450162450, "sha256": "a3f905b026083cb8c4e8e261dae4e3642919a4f1376d44375e6b6b2ad5767590"},
  "inner_archive": {"name": "image.tar.gz", "bytes": 449955956, "sha256": "d7f3c0b767094cc9f1602397c86d2faa25e44872d86b71cbd039226513f5ff85"},
  "image": {"platform": "linux/amd64", "upstream": "8707e33c124e4b1a68dde92d5e05178c9aabd0be", "opaque_config_sha256": "6b1d4c45a24da11e2f1c66da8eb486832660e4565334689c91ef9353fe158f49", "layers": 23, "uncompressed_layer_bytes": 1525317632, "rootfs_diff_ids_sha256": "69fbb4154339321f3932a9489db5c499f5efbac4bb58e350e676a9ef08d68e31"},
  "source_release": "documenso-source-4aa6ff574",
  "build_context_review": {"source": "Pinned public upstream and two recorded public patches", "upstream_checkout_persist_credentials": false, "no_build_args_or_secret_mounts": true, "dockerfile_arguments": "Public development placeholders or empty values, not deployment keys", "environment_file_inventory": [".env.example"], "npm_config": "Public peer/dedupe/release-age settings only", "private_dotenv_ignored": true, "miru_checkout_git_config_outside_build_context": true},
  "source_asset": {"name": "documenso-8707e33-source-4aa6ff574-amd64.tar.gz", "bytes": 58498058, "sha256": "5b94ae4dc456b853964100cebc1263819bac762b7c9205cc8a8675f8ae916ee2"},
  "verification": {"zip_crc_and_exact_members": true, "zip_and_inner_archive_hashes": true, "original_build_provenance": true, "prepared_dockerfile_license_and_both_patches": true, "opaque_config_hash": true, "selected_public_platform_labels": true, "all_23_raw_rootfs_layer_hashes": true, "env_decoded": false, "docker_load": false, "application_started": false, "functional_qa_passed": false}
}
'''
        (transport / TRANSPORT_MANIFEST).write_bytes(admission)
        image_asset = {"id": IMAGE_ASSET_ID, "name": IMAGE_ASSET_NAME, "size": 450162450, "digest": "sha256:" + ZIP_SHA, "state": "uploaded"}
        manifest_asset = {"id": MANIFEST_ASSET_ID, "name": TRANSPORT_MANIFEST, "size": 2688, "digest": "sha256:" + TRANSPORT_MANIFEST_SHA, "state": "uploaded"}
        metadata = {
            "release-metadata.json": {"id": RELEASE_ID, "tag_name": QA_TAG, "target_commitish": HEAD, "prerelease": True, "draft": False, "assets": [image_asset, manifest_asset]},
            "image-asset-metadata.json": image_asset,
            "manifest-asset-metadata.json": manifest_asset,
            "tag-metadata.json": {"ref": "refs/tags/" + QA_TAG, "object": {"type": "commit", "sha": HEAD}},
            "run-metadata.json": {"id": RUN_ID, "run_attempt": 1, "head_sha": HEAD, "status": "completed", "conclusion": "success", "path": ".github/workflows/documenso-build.yml", "repository": {"id": 433874407}},
        }
        for name, value in metadata.items():
            (transport / name).write_text(json.dumps(value))
        verify_transport(transport)
        mutations = [
            ("release-metadata.json", ("id",), 0), ("release-metadata.json", ("tag_name",), "wrong"),
            ("release-metadata.json", ("target_commitish",), UPSTREAM), ("release-metadata.json", ("prerelease",), False),
            ("release-metadata.json", ("draft",), True), ("tag-metadata.json", ("ref",), "refs/tags/wrong"),
            ("tag-metadata.json", ("object", "type"), "tag"), ("tag-metadata.json", ("object", "sha"), UPSTREAM),
            ("run-metadata.json", ("id",), 0), ("run-metadata.json", ("run_attempt",), 2),
            ("run-metadata.json", ("head_sha",), UPSTREAM), ("run-metadata.json", ("path",), ".github/workflows/wrong.yml"),
            ("run-metadata.json", ("status",), "in_progress"), ("run-metadata.json", ("conclusion",), "failure"),
            ("run-metadata.json", ("repository", "id"), 0),
        ]
        for name in ("image-asset-metadata.json", "manifest-asset-metadata.json"):
            mutations.extend((name, (field,), value) for field, value in (("id", 0), ("name", "wrong"), ("size", 1), ("digest", "sha256:" + "0" * 64), ("state", "new")))
        for index in range(2):
            mutations.extend(("release-metadata.json", ("assets", index, field), value) for field, value in (("id", 0), ("name", "wrong"), ("size", 1), ("digest", "sha256:" + "0" * 64), ("state", "new")))
        for name, keys, replacement in mutations:
            changed = json.loads(json.dumps(metadata[name]))
            target = changed
            for key in keys[:-1]:
                target = target[key]
            target[keys[-1]] = replacement
            (transport / name).write_text(json.dumps(changed))
            try:
                verify_transport(transport)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Changed durable transport metadata accepted")
            (transport / name).write_text(json.dumps(metadata[name]))
        for changed in (admission + b" ", admission.replace(b'"attempt": 1', b'"attempt": 2'), b"[" + admission[1:]):
            (transport / TRANSPORT_MANIFEST).write_bytes(changed)
            try:
                verify_transport(transport)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Altered transport manifest accepted")
        (transport / TRANSPORT_MANIFEST).write_bytes(admission)
        verify_transport(transport)
        operation = root / "operation"
        (operation / "output").mkdir(parents=True)
        candidate = operation / "output/share-client.png"
        candidate.write_bytes(valid)
        secret = root / "synthetic-private"
        secret.write_bytes(b"SYNTHETIC_NOT_FOR_UPLOAD")
        fake = Lifecycle(argparse.Namespace(work=root / "export"))
        fake.work.mkdir()
        fake.op, fake.output = operation, fake.work / "evidence"
        fake.state.update(uid=os.getuid(), uid_isolated=True, setup_uid=os.getuid(), cleanup_complete=True, runtime_processes_stopped=True)
        original_validate = validate_png_bytes
        def swap_after_validation(data):
            original_validate(data)
            candidate.unlink()
            candidate.symlink_to(secret)
        with patch.dict(globals(), {"uid_processes": lambda uid: [], "validate_png_bytes": swap_after_validation}):
            assert fake.export_evidence(False)
        assert read_regular(fake.output / "share-client.png", 1024) == valid
        fake.output = fake.work / "blocked"
        fake.state["runtime_processes_stopped"] = False
        assert not fake.export_evidence(False) and not (fake.output / "share-client.png").exists()
        assert read_json(fake.output / "lifecycle.json")["evidence_rejections"] == ["runtime_cleanup_incomplete"]
        header = "Num RefCount Protocol Flags Type St Inode Path\n"
        filesystem = (header + "0: 00000001 00000000 00010000 0001 01 900 /run/snapd.socket\n" +
                      "1: 00000001 00000000 00000000 0002 01 901 /run/journal-socket\n" +
                      "2: 00000002 00000000 00000000 0001 03 902 /run/connected-client\n").encode()
        listeners = unix_listeners(filesystem)
        assert listeners == [(900, "/run/snapd.socket", 1), (901, "/run/journal-socket", 2)]
        assert unix_admission_paths(listeners) == {"/run/snapd.socket", "/run/journal-socket"}
        block, sessions = root / "storage-block", root / "storage-sessions"
        block.mkdir()
        sessions.mkdir()
        paths = {"/sys/block": block, "/sys/class/iscsi_session": sessions}
        with patch.dict(globals(), {"Path": paths.__getitem__}):
            with patch.dict(globals(), {"checked": Mock(side_effect=AssertionError("Unexpected storage command"))}):
                assert runner_storage_state() == (False, False)
            (block / "dm-0").mkdir()
            for output, expected in ((b"", False), (b"mpath-synthetic (253:0)\n", True), (b"No devices found\n", True)):
                def device_query(command, output=output):
                    assert command == ["dmsetup", "ls", "--target", "multipath"]
                    return output
                with patch.dict(globals(), {"checked": device_query}):
                    assert runner_storage_state() == (expected, False)
                    (sessions / "session1").mkdir()
                    assert runner_storage_state() == (expected, True)
                    (sessions / "session1").rmdir()
            with patch.dict(globals(), {"checked": Mock(side_effect=subprocess.CalledProcessError(1, "dmsetup"))}):
                try:
                    runner_storage_state()
                except subprocess.CalledProcessError:
                    pass
                else:
                    raise AssertionError("Storage query failure accepted")
        storage = [(900, "@/org/kernel/linux/storage/multipathd", 1), (901, "@ISCSIADM_ABSTRACT_NAMESPACE", 1)]
        unit_listens = {"multipathd.socket": "Id=multipathd.socket\nAccept=no\nTriggers=multipathd.service\nListen=@/org/kernel/linux/storage/multipathd (Stream)\nListen=/run/multipathd.socket (Stream)",
                        "iscsid.socket": "Id=iscsid.socket\nAccept=no\nTriggers=iscsid.service\nListen=@ISCSIADM_ABSTRACT_NAMESPACE (Stream)"}
        assert runner_storage_units(storage, unit_listens, False, False) == ["iscsid.socket", "iscsid.service", "multipathd.socket", "multipathd.service"]
        assert runner_storage_units(listeners, {}, True, True) == []
        for args in ((storage, unit_listens, True, False), (storage, unit_listens, False, True),
                     (storage + [(903, "@unknown", 1)], unit_listens, False, False), (storage, {}, False, False),
                     *((storage, {**unit_listens, "iscsid.socket": unit_listens["iscsid.socket"].replace(old, new)}, False, False)
                       for old, new in (("(Stream)", "(Datagram)"), ("NAMESPACE (", "NAMESPACE_suffix ("),
                                        ("Accept=no", "Accept=yes"), ("Id=iscsid.socket", "Id=other.socket"),
                                        ("Triggers=iscsid.service", "Triggers=other.service"), ("Accept=no", "Accept=no\nAccept=no"))),
                     ([(900, "relative", 1)], {}, False, False), ([(900, "@ISCSIADM_ABSTRACT_NAMESPACE", 2)], unit_listens, False, False)):
            try:
                runner_storage_units(*args)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unsafe runner storage preparation admitted")
        abstract = unix_listeners((header + "0: 00000001 00000000 00010000 0001 01 903 @foreign-relay\n").encode())
        for rejected in (lambda: unix_admission_paths(abstract), lambda: unix_isolated(abstract, set(listeners), set()),
                         lambda: unix_isolated([(904, "/run/new-relay", 1)], set(listeners), set())):
            try:
                rejected()
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unreviewed Unix relay accepted")
        unix_isolated(abstract, set(listeners), {903})
        monitor = Lifecycle(argparse.Namespace(work=root / "unix-observations"))
        monitor.state["uid"] = os.getuid()
        runtime_socket = (header + "0: 00000001 00000000 00010000 0001 01 903 @synthetic\n").encode()
        empty = header.encode()
        for snapshots, owners, refused in (
            ([runtime_socket, empty, empty, empty], [set(), set()], False),
            ([empty, runtime_socket, runtime_socket, runtime_socket], [set(), set()], True),
            ([runtime_socket, empty, empty, runtime_socket], [set(), set()], True),
        ):
            snapshots, owners = iter(snapshots), iter(owners)
            with patch.dict(globals(), {"read_regular": lambda *_: next(snapshots),
                                       "owned_unix_inodes": lambda *_: next(owners), "RELAY_SOCKETS": ()}):
                try:
                    monitor.check_relays()
                except RuntimeError:
                    assert refused
                else:
                    assert not refused
        for unavailable in (root / "missing-protected-socket", path):
            cleanup = Lifecycle(argparse.Namespace(work=root / "cleanup-observation"))
            cleanup.state["relay_acls"] = [{"path": str(unavailable), "device": -1, "inode": -1}]
            cleanup.save = lambda: None
            with patch.object(subprocess, "run", side_effect=AssertionError("External command refused")) as commands:
                assert not cleanup.cleanup()
                commands.assert_not_called()
            assert cleanup.state["cleanup_errors"] == ["relay_acl_cleanup"] and not cleanup.state["cleanup_complete"]
        ephemeral = port_range(b"32768\t60999\n")
        bound = []
        class FixtureSocket:
            def __init__(self, family):
                self.family = family
            def __enter__(self):
                return self
            def __exit__(self, *_):
                return False
            def bind(self, address):
                assert address[1] != 0 and not ephemeral[0] <= address[1] <= ephemeral[1]
                bound.append(address)
                if address[1] == 20000:
                    raise OSError(errno.EADDRINUSE, "fixture occupied")
        with patch.object(socket, "socket", FixtureSocket):
            used = set()
            assert free_port(used, ephemeral) == 20001
            assert free_port(used, ephemeral, "::1") == 20002 and len(used) == 2
            try:
                free_port(set(), (1024, 65535))
            except RuntimeError:
                pass
            else:
                raise AssertionError("Port selected inside all-ephemeral range")
        assert all(not ephemeral[0] <= port <= ephemeral[1] for _, port in bound)
        handlers = {sig: signal.getsignal(sig) for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGALRM)}
        try:
            shield_cleanup()
            os.kill(os.getpid(), signal.SIGINT)
            os.kill(os.getpid(), signal.SIGTERM)
            assert signal.getsignal(signal.SIGALRM) == handlers[signal.SIGALRM]
        finally:
            for sig, handler in handlers.items():
                signal.signal(sig, handler)
    print("Offline lifecycle checks passed; no Docker, users, firewall, network or app started")


def main(argv=None):
    args = parse_args(sys.argv[1:] if argv is None else argv)
    if args.self_check:
        self_check()
        return 0
    require(sys.platform == "linux" and os.geteuid() == 0 and os.environ.get("GITHUB_ACTIONS") == "true" and os.environ.get("CI") == "true" and os.environ.get("RUNNER_OS") == "Linux" and os.environ.get("RUNNER_ENVIRONMENT") == "github-hosted", "Ephemeral GitHub-hosted Linux root required")
    lifecycle = Lifecycle(args)
    if args.cleanup:
        shield_cleanup()
        signal.signal(signal.SIGALRM, lambda *_: sys.exit(142))
        signal.setitimer(signal.ITIMER_REAL, 175)
        if not lifecycle.state_path.exists():
            return 0
        state = read_json(lifecycle.state_path)
        require(state.get("schema_version") == 1 and re.fullmatch(r"miru-live-[0-9a-f]{16}", state.get("operation", "")))
        lifecycle.state = state
        lifecycle.op = Path(state["operation_root"])
        lifecycle.setup = Path(state["setup_root"])
        require(lifecycle.op == args.work / state["operation"] and lifecycle.setup == args.work / (state["operation"] + "-setup"))
        cleaned = state.get("cleanup_complete") or lifecycle.cleanup()
        if cleaned:
            for path in (lifecycle.op, lifecycle.setup):
                if path.exists():
                    shutil.rmtree(path)
            os.chmod(args.work, 0o700)
        return 0 if cleaned else 1
    require(args.work.is_dir() and stat.S_IMODE(args.work.stat().st_mode) == 0o700)
    git = ["git", "-c", "safe.directory=" + str(args.app), "-C", str(args.app)]
    require(checked([*git, "rev-parse", "HEAD"]).decode().strip() == HEAD)
    require(checked([*git, "rev-parse", "HEAD^{tree}"]).decode().strip() == TREE)
    require(not checked([*git, "status", "--porcelain"]).strip())
    handlers = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGALRM)}
    signal.setitimer(signal.ITIMER_REAL, max(.1, 1490 - (time.monotonic() - lifecycle.started)))
    passed = False
    cleaned = False
    evidence_ok = False
    try:
        lifecycle.prepare_user()
        lifecycle.save()
        docker_root = Path(json.loads(lifecycle.docker("info", "--format", '{"root":{{json .DockerRootDir}}}'))["root"])
        version = lifecycle.docker("version", "--format", "{{.Server.Version}}").decode().strip()
        require(engine_supported(version), "Docker Engine26+ required for internal-network DNS isolation")
        lifecycle.state["engine_version"] = version
        capacity(args.work, docker_root)
        image, diff_ids = verify_artifact(args.artifact, lifecycle.setup)
        lifecycle.state["artifact_verified"] = True
        lifecycle.save()
        for name, (_, size, sha) in SOURCE_ASSETS.items():
            path = args.source / name
            require(path.is_file() and not path.is_symlink() and path.stat().st_size == size and digest(path) == sha)
        for reference, config_sha, _, _ in IMAGES.values():
            lifecycle.wait(lifecycle.start(["docker", "pull", "--platform", "linux/amd64", reference], "pull-" + config_sha[:8]), 120)
            require(lifecycle.docker("image", "inspect", reference, "--format", "{{.Id}} {{.Os}}/{{.Architecture}}").decode().strip() == "sha256:" + config_sha + " linux/amd64")
        capacity(args.work, docker_root)
        lifecycle.wait(lifecycle.start(["docker", "load", "--input", str(image)], "image-load"), 120)
        selected = json.loads(lifecycle.docker("image", "inspect", "sha256:" + CONFIG_SHA, "--format", '{"id":{{json .Id}},"os":{{json .Os}},"arch":{{json .Architecture}},"layers":{{json .RootFS.Layers}},"source":{{json (index .Config.Labels "org.opencontainers.image.source")}},"revision":{{json (index .Config.Labels "org.opencontainers.image.revision")}},"build":{{json (index .Config.Labels "io.miru.build-revision")}}}'))
        require(selected == {"id": "sha256:" + CONFIG_SHA, "os": "linux", "arch": "amd64", "layers": diff_ids, "source": "https://github.com/documenso/documenso", "revision": UPSTREAM, "build": CHECKOUT})
        lifecycle.state["image_import_verified"] = True
        lifecycle.save()
        lifecycle.compose("sha256:" + CONFIG_SHA, args.source)
        lifecycle.qualify_egress()
        lifecycle.start_services()
        lifecycle.runtime_config(diff_ids)
        validate_summary(read_json(lifecycle.op / "output/summary.json"))
        require(read_json(lifecycle.op / "output/summary.json")["passed"] is True, "Functional matrix incomplete")
        lifecycle.phase = "complete"
        passed = True
    finally:
        shield_cleanup()
        signal.setitimer(signal.ITIMER_REAL, max(.1, min(300, 1800 - (time.monotonic() - lifecycle.started))))
        try:
            if lifecycle.state.get("setup_uid"):
                try:
                    lifecycle.output.mkdir(mode=0o700)
                    private(lifecycle.output / "lifecycle.json", json.dumps({"schema_version": 1, "passed": False, "phase": lifecycle.phase, "image_config_sha256": CONFIG_SHA, "cleanup_complete": False, "evidence_rejections": ["cleanup_pending"]}))
                    os.chown(lifecycle.output / "lifecycle.json", lifecycle.state["setup_uid"], -1)
                    os.chown(lifecycle.output, lifecycle.state["setup_uid"], -1)
                except Exception:
                    pass
            cleaned = lifecycle.cleanup() if lifecycle.state_path.exists() else False
            try:
                if lifecycle.op.exists() and lifecycle.state.get("setup_uid"):
                    evidence_ok = lifecycle.export_evidence(passed and cleaned)
            finally:
                if cleaned:
                    for path in (lifecycle.op, lifecycle.setup):
                        if path.exists():
                            shutil.rmtree(path)
                    os.chmod(args.work, 0o700)
        finally:
            signal.setitimer(signal.ITIMER_REAL, 0)
            for sig, handler in handlers.items():
                signal.signal(sig, handler)
    return 0 if passed and cleaned and evidence_ok else 1


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as error:
        report_failure(error)
        raise SystemExit(1)
