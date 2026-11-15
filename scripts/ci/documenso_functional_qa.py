#!/usr/bin/env python3
"""Manual, exact-artifact Documenso QA on an ephemeral GitHub-hosted Linux VM."""

import argparse
from contextlib import contextmanager
import errno
import gzip
import grp
import hashlib
import io
import ipaddress
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
TCP_RELAYS = {"pg": ("database", 5432), "smtp": ("mailpit", 1025), "provider": ("proxy", 8080), "mailpit": ("proxy", 8081)}
SOCKET_ACTIVATE = Path("/usr/bin/systemd-socket-activate")
SOCKET_PROXY = Path("/usr/lib/systemd/systemd-socket-proxyd")
COMMAND_LABELS = {"schema", "assets", "functional"}
COMMAND_FAILURE_MARKERS = {
    "pg": (b"PG::ConnectionBad", b"PG::UnableToSend", b"ActiveRecord::ConnectionNotEstablished", b"ActiveRecord::DatabaseConnectionError", b"ActiveRecord::NoDatabaseError"),
    "bundler": (b"Bundler::GemNotFound", b"Bundler::GemfileNotFound", b"Bundler::GemfileError", b"Bundler::VersionConflict", b"Bundler::ProductionError"),
    "permission": (b"Errno::EACCES", b"Errno::EPERM", b"Permission denied"),
    "missing_file_or_executable": (b"Errno::ENOENT", b"LoadError", b"command not found", b"No such file or directory"),
    "rspec": (b"RSpec::Expectations::ExpectationNotMetError", b"Failure/Error:", b"Failed examples:"),
}
COMMAND_FAILURE_CATEGORIES = set(COMMAND_FAILURE_MARKERS) | {"unclassified", "unavailable"}
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
        if frame.tb_frame.f_code.co_filename == __file__ and frame.tb_frame.f_code not in (require.__code__, checked.__code__):
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


def read_regular(path, limit, *, private_journal=False):
    descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as stream:
        info = os.fstat(stream.fileno())
        require(stat.S_ISREG(info.st_mode) and info.st_size <= limit)
        if private_journal:
            require(info.st_uid == 0 and stat.S_IMODE(info.st_mode) == 0o600 and info.st_nlink == 1, "Untrusted cleanup journal refused")
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


def command_failure_category(path):
    try:
        descriptor = os.open(path, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
        with os.fdopen(descriptor, "rb") as stream:
            info = os.fstat(stream.fileno())
            require(stat.S_ISREG(info.st_mode) and info.st_uid == 0 and stat.S_IMODE(info.st_mode) == 0o600 and info.st_nlink == 1)
            stream.seek(max(0, info.st_size - 65536))
            tail = stream.read(65536)
    except (OSError, RuntimeError, ValueError):
        return "unavailable"
    for category, markers in COMMAND_FAILURE_MARKERS.items():
        if any(marker in tail for marker in markers):
            return category
    return "unclassified"


def validate_command_failure(value):
    require(isinstance(value, dict) and set(value) == {"label", "returncode", "category"})
    require(isinstance(value["label"], str) and value["label"] in COMMAND_LABELS)
    require(type(value["returncode"]) is int and -64 <= value["returncode"] <= 255 and value["returncode"] != 0)
    require(isinstance(value["category"], str) and value["category"] in COMMAND_FAILURE_CATEGORIES)


def checked(command, *, input=None, timeout=30, env=None, cwd=None):
    return subprocess.run(command, input=input, capture_output=True, check=True, timeout=timeout,
                          env=BASE_ENV if env is None else env, cwd=cwd).stdout


def source_git(app):
    return ["git", "-c", "safe.directory=" + str(app), "-c", "core.fsmonitor=false", "-c", "core.hooksPath=/dev/null", "-c", "protocol.allow=never", "-C", str(app)]


GIT_ENV = {**BASE_ENV, "GIT_CONFIG_NOSYSTEM": "1", "GIT_CONFIG_GLOBAL": "/dev/null", "GIT_NO_LAZY_FETCH": "1", "GIT_NO_REPLACE_OBJECTS": "1", "GIT_OPTIONAL_LOCKS": "0"}


def stage_source(app, destination):
    records = checked([*source_git(app), "ls-tree", "-rz", HEAD], env=GIT_ENV).split(b"\0")
    require(records.pop() == b"" and 0 < len(records) <= 10000)
    entries = []
    for record in records:
        metadata, raw_path = record.split(b"\t", 1)
        mode, kind, oid = metadata.split(b" ")
        path = PurePosixPath(os.fsdecode(raw_path))
        require(mode in (b"100644", b"100755") and kind == b"blob" and re.fullmatch(rb"[0-9a-f]{40}", oid))
        require(path.parts and not path.is_absolute() and not {"..", ".git"}.intersection(path.parts) and str(path) == os.fsdecode(raw_path) and b"\\" not in raw_path)
        entries.append((mode, oid, path))
    require(len({path for _, _, path in entries}) == len(entries))
    destination.mkdir(mode=0o700)
    with tempfile.TemporaryFile() as requests:
        requests.write(b"".join(oid + b"\n" for _, oid, _ in entries))
        requests.seek(0)
        process = timer = None
        try:
            with defer_cancellation():
                process = subprocess.Popen([*source_git(app), "cat-file", "--batch"], stdin=requests, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, env=GIT_ENV)
                timer = threading.Timer(30, process.kill)
                timer.start()
            total = 0
            for mode, oid, path in entries:
                raw_header = process.stdout.readline(128)
                header = raw_header.split()
                require(len(header) == 3 and header[:2] == [oid, b"blob"] and re.fullmatch(rb"0|[1-9][0-9]*", header[2]))
                require(raw_header == oid + b" blob " + header[2] + b"\n")
                size = int(header[2])
                total += size
                require(size <= 16 * 1024**2 and total <= 128 * 1024**2)
                data = process.stdout.read(size)
                require(len(data) == size and process.stdout.read(1) == b"\n")
                require(hashlib.sha1(b"blob " + str(size).encode() + b"\0" + data).hexdigest().encode() == oid)
                target = destination / path
                private(target, data)
                target.chmod(0o755 if mode == b"100755" else 0o644)
            require(process.stdout.read(1) == b"" and process.wait(timeout=5) == 0)
        finally:
            with defer_cancellation():
                if timer is not None:
                    timer.cancel()
                try:
                    if process is not None:
                        if process.poll() is None:
                            process.kill()
                        process.wait(timeout=5)
                finally:
                    if process is not None:
                        process.stdout.close()
                    if timer is not None and timer.ident is not None:
                        timer.join(timeout=5)
                        require(not timer.is_alive(), "Source reader timer did not stop")


def contained_links(root):
    root = root.resolve(strict=True)
    for directory, directories, files in os.walk(root, followlinks=False):
        for name in directories + files:
            path = Path(directory) / name
            if path.is_symlink():
                require(path.resolve().is_relative_to(root), "Staged dependency symlink escapes its root")


def stage_inputs(app, pnpm, destination):
    staged_app, staged_pnpm = destination / "app", destination / "pnpm"
    stage_source(app, staged_app)
    for name in ("node_modules", "vendor/bundle"):
        source = app / name
        require(source.is_dir() and not source.is_symlink())
        shutil.copytree(source, staged_app / name, symlinks=True)
    contained_links(staged_app)
    executable = pnpm.resolve(strict=True)
    package = executable.parent.parent
    require(executable == package / "bin/pnpm.cjs" and read_json(package / "package.json").get("name") == "pnpm")
    shutil.copytree(package, staged_pnpm, symlinks=True)
    require((staged_pnpm / "bin/pnpm.cjs").is_file() and not (staged_pnpm / "bin/pnpm.cjs").is_symlink())
    cli = staged_pnpm / "bin/pnpm"
    cli.symlink_to("pnpm.cjs")
    contained_links(staged_pnpm)
    return staged_app, cli


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
    try:
        fields = (root / "stat").read_text().rsplit(")", 1)[1].split()
        uid = int(next(line.split()[1] for line in (root / "status").read_text().splitlines() if line.startswith("Uid:")))
    except (FileNotFoundError, ProcessLookupError):
        return None
    return {"pid": pid, "start": fields[19], "uid": uid}


def principal_prefix(uid, gid):
    return ["setpriv", "--reuid", str(uid), "--regid", str(gid), "--clear-groups", "--no-new-privs", "--inh-caps=-all", "--ambient-caps=-all", "--bounding-set=-all"]


def endpoint_snapshot(rows, network, project, operation, expected=None):
    name = project + "_qa_internal"
    require(network["name"] == name and HEX.fullmatch(network["id"]) and network["driver"] == "bridge")
    require(network["internal"] is True and network["ipv6"] is False and network["operation"] == operation and network["project"] == project)
    require(network["ipam"]["Driver"] == "default" and len(network["ipam"]["Config"]) == 1)
    config = network["ipam"]["Config"][0]
    subnet = ipaddress.ip_network(config["Subnet"])
    require(subnet.version == 4 and any(subnet.subnet_of(ipaddress.ip_network(prefix)) for prefix in ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16")))
    if config.get("Gateway"):
        require(ipaddress.ip_address(config["Gateway"]) in subnet)
    require(len(rows) == 4 and {row["service"] for row in rows} == {"database", "documenso", "mailpit", "proxy"})
    require(set(network["containers"]) == {row["id"] for row in rows} and len(network["containers"]) == 4)
    endpoints = {}
    for row in rows:
        require(HEX.fullmatch(row["id"]) and set(row["networks"]) == {name})
        endpoint = row["networks"][name]
        record = network["containers"][row["id"]]
        address = ipaddress.ip_address(endpoint["IPAddress"])
        require(address.version == 4 and address in subnet and address not in (subnet.network_address, subnet.broadcast_address))
        require(str(address) != config.get("Gateway") and endpoint["IPPrefixLen"] == subnet.prefixlen)
        require(endpoint["NetworkID"] == network["id"] and HEX.fullmatch(endpoint["EndpointID"]) and record["EndpointID"] == endpoint["EndpointID"])
        require(record["IPv4Address"] == str(address) + "/" + str(subnet.prefixlen) and not record["IPv6Address"] and not endpoint["GlobalIPv6Address"])
        require(record["Name"] == row["name"].removeprefix("/"))
        endpoints[row["service"]] = {"container": row["id"], "endpoint": endpoint["EndpointID"], "address": str(address), "name": record["Name"]}
    require(len({row["address"] for row in endpoints.values()}) == 4)
    snapshot = {"network": network["id"], "subnet": str(subnet), "gateway": config.get("Gateway", ""), "endpoints": endpoints}
    require(expected is None or snapshot == expected, "Owned network endpoints changed")
    return snapshot


def tcp_relay_command(name, port, snapshot):
    service, target_port = TCP_RELAYS[name]
    require(type(port) is int and 1024 <= port <= 65535)
    address = ipaddress.ip_address(snapshot["endpoints"][service]["address"])
    require(address.version == 4 and address in ipaddress.ip_network(snapshot["subnet"]))
    return [str(SOCKET_ACTIVATE), "--listen=127.0.0.1:" + str(port), str(SOCKET_PROXY), "--connections-max=32", f"{address}:{target_port}"]


def tcp_listener(raw, port, pid):
    lines = raw.decode().splitlines()
    require(len(lines) == 1, "Owned TCP listener missing or duplicated")
    fields = lines[0].split(maxsplit=5)
    require(len(fields) == 6 and fields[0] == "LISTEN" and fields[1].isdigit() and fields[2].isdigit())
    require(fields[3] == f"127.0.0.1:{port}" and fields[4] == "0.0.0.0:*")
    owner = re.fullmatch(r'users:\(\("[^"\\\r\n]+",pid=([1-9][0-9]*),fd=([0-9]+)\)\)', fields[5])
    require(owner is not None and int(owner[1]) == pid, "TCP listener ownership changed")


def relay_principal(raw, uid, gid):
    rows = dict(line.split(":", 1) for line in raw.decode().splitlines() if ":" in line)
    require(uid != 0 and rows["Uid"].split() == [str(uid)] * 4 and rows["Gid"].split() == [str(gid)] * 4)
    require(not rows["Groups"].split() and rows["NoNewPrivs"].strip() == "1")
    require(all(int(rows[key].strip(), 16) == 0 for key in ("CapInh", "CapPrm", "CapEff", "CapBnd", "CapAmb")), "TCP relay retained authority")


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


def provider_healthy(health):
    if not isinstance(health, dict) or health.get("status") != "ok":
        return False
    checks = health.get("checks")
    return isinstance(checks, dict) and all(isinstance(checks.get(name), dict) and checks[name].get("status") == "ok"
                                            for name in ("database", "certificate"))


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


def wait_runner_jobs():
    until = time.monotonic() + 30
    while checked(["systemctl", "list-jobs", "--no-legend", "--no-pager"], timeout=5).strip():
        require(time.monotonic() < until, "Runner has pending systemd jobs")
        time.sleep(.2)


def required_access_failures(raw):
    flags = json.loads(raw)
    labels = ("gemfile", "spec", "ruby", "bundle", "node", "pnpm", "brave")
    require(isinstance(flags, list) and len(flags) == len(labels) and all(type(flag) is bool for flag in flags))
    return [label for label, accessible in zip(labels, flags) if not accessible]


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
        return principal_prefix(self.uid, self.gid)

    def check_authority(self, uid, gid):
        probe = r'''import errno,os,socket,subprocess,sys
assert os.getuid()==int(sys.argv[1])!=0 and os.getgid()==int(sys.argv[2]) and not os.getgroups()
assert subprocess.run(['sudo','-n','-l'],capture_output=True,timeout=5).returncode!=0
for endpoint in ('/var/run/docker.sock','/run/containerd/containerd.sock'):
 s=socket.socket(socket.AF_UNIX);s.settimeout(1)
 try:
  s.connect(endpoint)
 except OSError as e:
  assert e.errno in (errno.EACCES,errno.ENOENT,errno.ECONNREFUSED),e.errno
 else:
  raise AssertionError('Container API available to principal')
 finally:
  s.close()
for port in (2375,2376):
 s=socket.socket();s.settimeout(1)
 try:
  s.connect(('127.0.0.1',port))
 except OSError as e:
  assert e.errno==errno.ECONNREFUSED,e.errno
 else:
  raise AssertionError('Container TCP API available to principal')
 finally:
  s.close()
'''
        checked(principal_prefix(uid, gid) + ["python3", "-I", "-c", probe, str(uid), str(gid)], timeout=15)

    def start(self, command, name, runtime=False, env=None, cwd=None, setup_user=False):
        require(not (runtime and setup_user), "Ambiguous process principal")
        uid = self.state["setup_uid"] if setup_user else self.uid if runtime else 0
        gid = self.gid
        if setup_user:
            require(uid not in (0, self.uid) and gid == self.state["gid"] and gid != self.state["setup_gid"] and env is None, "TCP relay requires setup UID and the fresh QA group")
        prefix = principal_prefix(uid, gid) if runtime or setup_user else []
        log = self.setup / "private-logs" / (name + ".log")
        fd = os.open(log, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with defer_cancellation():
            with os.fdopen(fd, "wb") as stream:
                process = subprocess.Popen(prefix + command, cwd=cwd,
                                           env=(self.runtime_env if runtime else BASE_ENV) if env is None else env,
                                           stdin=subprocess.DEVNULL, stdout=stream, stderr=stream, start_new_session=True)
            if name in COMMAND_LABELS:
                process._qa_label = name
            self.handles.append(process)
            identity = process_identity(process.pid)
            require(identity is not None)
            require(identity["uid"] in (0, uid))
            identity["uid"] = uid
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
            self.inspect_tcp_relays()
            self.last_sample = time.monotonic()

    def wait(self, process, seconds):
        until = time.monotonic() + seconds
        while process.poll() is None:
            self.tick()
            require(time.monotonic() < until, "Owned command deadline reached")
            time.sleep(.2)
        label = getattr(process, "_qa_label", None)
        if process.returncode and isinstance(label, str) and label in COMMAND_LABELS:
            failure = {"label": label, "returncode": process.returncode, "category": command_failure_category(self.setup / "private-logs" / (label + ".log"))}
            validate_command_failure(failure)
            self.state["failed_command"] = failure
            try:
                self.save()
            except OSError:
                pass
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
        self.state.update(username=username, user_absent_before_create=True, operation_root=str(self.op), setup_root=str(self.setup), app_root=str(self.op / "app"), project=self.state["operation"])
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
        self.args.app, self.args.pnpm = stage_inputs(self.args.app, self.args.pnpm, self.op)
        self.spec = self.op / "documenso_live_provider_spec.rb"
        fixture = read_regular(Path(__file__).with_name(self.spec.name), 1024**2)
        private(self.spec, fixture, self.uid)
        require(digest(self.spec) == hashlib.sha256(fixture).hexdigest())
        for tree in (self.args.app, self.op / "pnpm"):
            for directory, directories, files in os.walk(tree, followlinks=False):
                for path in [Path(directory), *(Path(directory) / name for name in directories + files)]:
                    os.chown(path, self.uid, self.gid, follow_symlinks=False)
        self.protect_relays()
        self.check_authority(self.uid, self.gid)
        paths = [self.args.app / "Gemfile", self.spec, self.args.ruby, self.args.bundle, self.args.node, self.args.pnpm, self.args.brave]
        access = "import json,os,sys;print(json.dumps([os.access(p,os.R_OK) and (i<2 or os.access(p,os.X_OK)) for i,p in enumerate(sys.argv[1:])]))"
        inaccessible = required_access_failures(checked(self.runtime_prefix() + ["python3", "-I", "-c", access, *map(str, paths)]))
        if inaccessible:
            print(json.dumps({"runtime_inaccessible": inaccessible}), flush=True)
        require(not inaccessible, "Runtime cannot access required files")
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
        pg.update(env_file=[str(self.setup / "database.env")], volumes=[str(self.setup / "pgdata") + ":/var/lib/postgresql/data", str(self.setup / "init") + ":/docker-entrypoint-initdb.d:ro"], healthcheck={"test": ["CMD-SHELL", 'pg_isready -U "$$POSTGRES_USER" -d "$$POSTGRES_DB"'], "interval": "2s", "timeout": "2s", "retries": 60})
        pg["tmpfs"].append("/var/run/postgresql:rw,nosuid,nodev,uid=70,gid=70,mode=0775,size=16m")
        provider = service(provider_image, 1536, 1, 256, "1001:1001")
        provider.update(env_file=[str(self.setup / "provider.env")], environment={"PORT": "3000", "NEXT_PUBLIC_WEBAPP_URL": f"http://127.0.0.1:{self.ports['provider']}", "NEXT_PRIVATE_INTERNAL_WEBAPP_URL": "http://documenso:3000", "NEXT_PUBLIC_UPLOAD_TRANSPORT": "database", "NEXT_PRIVATE_JOBS_PROVIDER": "local", "NEXT_PRIVATE_SMTP_TRANSPORT": "smtp-auth", "NEXT_PRIVATE_SMTP_HOST": "mailpit", "NEXT_PRIVATE_SMTP_PORT": "1025", "NEXT_PRIVATE_SMTP_SECURE": "false", "NEXT_PRIVATE_SMTP_FROM_NAME": "Miru Synthetic QA ONLY", "NEXT_PRIVATE_SMTP_FROM_ADDRESS": "noreply@miru-qa.invalid", "NEXT_PRIVATE_SIGNING_LOCAL_FILE_PATH": "/opt/documenso/cert.p12"}, volumes=[str(self.setup / "seal/cert.p12") + ":/opt/documenso/cert.p12:ro"], depends_on={"database": {"condition": "service_healthy"}, "mailpit": {"condition": "service_started"}})
        provider["tmpfs"].append("/app/apps/web/.next/cache:rw,nosuid,nodev,uid=1001,gid=1001,mode=0700,size=128m")
        mail = service(IMAGES["mailpit"][0], 128, .25, 64, "1000:1000")
        proxy_service = service(IMAGES["proxy"][0], 64, .25, 32, "101:101")
        proxy_service.update(entrypoint=["nginx", "-g", "daemon off;"], depends_on=["documenso", "mailpit"], volumes=[str(self.setup / "proxy.conf") + ":/etc/nginx/nginx.conf:ro", str(site) + ":/qa-source:ro"])
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
        template = '{"id":{{json .Id}},"name":{{json .Name}},"image":{{json .Image}},"project":{{json (index .Config.Labels "com.docker.compose.project")}},"operation":{{json (index .Config.Labels "so.miru.qa.operation")}},"service":{{json (index .Config.Labels "com.docker.compose.service")}},"running":{{json .State.Running}},"oom":{{json .State.OOMKilled}},"readonly":{{json .HostConfig.ReadonlyRootfs}},"privileged":{{json .HostConfig.Privileged}},"dns":{{json .HostConfig.Dns}},"memory":{{json .HostConfig.Memory}},"swap":{{json .HostConfig.MemorySwap}},"pids":{{json .HostConfig.PidsLimit}},"cpus":{{json .HostConfig.NanoCpus}},"caps":{{json .HostConfig.CapDrop}},"security":{{json .HostConfig.SecurityOpt}},"user":{{json .Config.User}},"binds":{{json .HostConfig.Binds}},"bindings":{{json .HostConfig.PortBindings}},"ports":{{json .NetworkSettings.Ports}},"networks":{{json .NetworkSettings.Networks}}}'
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
            published = {port: values for port, values in (row["ports"] or {}).items() if values}
            require(not row["bindings"] and not published, "Container port publication refused")
            require(set(row["networks"]) == {self.state["project"] + "_qa_internal"})
            if running:
                require(row["running"], "Owned container exited")
        if self.state["containers"]:
            require(set(ids) == set(self.state["containers"]), "Owned container set changed")
        require(len(rows) == 4 and len({row["service"] for row in rows}) == 4)
        network = json.loads(self.docker("network", "inspect", self.state["project"] + "_qa_internal", "--format", '{"id":{{json .Id}},"name":{{json .Name}},"driver":{{json .Driver}},"internal":{{json .Internal}},"ipv6":{{json .EnableIPv6}},"operation":{{json (index .Labels "so.miru.qa.operation")}},"project":{{json (index .Labels "com.docker.compose.project")}},"ipam":{{json .IPAM}},"containers":{{json .Containers}}}'))
        snapshot = endpoint_snapshot(rows, network, self.state["project"], self.state["operation"], self.state.get("endpoint_snapshot"))
        if "endpoint_snapshot" not in self.state:
            self.state.update(endpoint_snapshot=snapshot, containers=ids)
            self.save()
        return rows

    def relay_listener_output(self, port):
        return checked(["ss", "-H", "-ltnp", "(", "sport", "=", ":" + str(port), ")"], timeout=5)

    def inspect_tcp_relay(self, relay):
        identity = relay["identity"]
        require(process_identity(identity["pid"]) == identity, "Owned TCP relay exited or changed principal")
        root = Path("/proc") / str(identity["pid"])
        require((root / "exe").resolve() == SOCKET_PROXY, "TCP relay executable changed")
        relay_principal(read_regular(root / "status", 65536), self.state["setup_uid"], self.state["gid"])
        expected_argv = tcp_relay_command(relay["name"], relay["port"], self.state["endpoint_snapshot"])[2:]
        require(read_regular(root / "cmdline", 4096) == b"\0".join(os.fsencode(value) for value in expected_argv) + b"\0", "TCP relay destination argv changed")
        tcp_listener(self.relay_listener_output(relay["port"]), relay["port"], identity["pid"])

    def inspect_tcp_relays(self):
        require(len(self.state.get("tcp_relays", [])) == 4 and {relay["name"] for relay in self.state["tcp_relays"]} == set(TCP_RELAYS))
        for relay in self.state["tcp_relays"]:
            self.inspect_tcp_relay(relay)

    def require_stopped_tcp_relays(self):
        relays = self.state.get("tcp_relays", [])
        for relay in relays:
            require(relay["name"] in TCP_RELAYS and type(relay["port"]) is int and 1024 <= relay["port"] <= 65535)
            identity = relay["identity"]
            if identity is not None:
                require(identity in self.state["processes"] and identity["uid"] == self.state["setup_uid"])
        until = time.monotonic() + 5
        while True:
            remaining = False
            for relay in relays:
                identity = relay["identity"]
                actual = process_identity(identity["pid"]) if identity is not None else None
                remaining |= actual is not None and actual["start"] == identity["start"]
                remaining |= bool(self.relay_listener_output(relay["port"]).strip())
            if not remaining:
                return
            require(time.monotonic() < until, "TCP relay process or listener remains; foreign processes are preserved")
            time.sleep(.1)

    def start_tcp_relays(self):
        self.check_authority(self.state["setup_uid"], self.gid)
        for binary in (SOCKET_ACTIVATE, SOCKET_PROXY):
            info = binary.lstat()
            require(stat.S_ISREG(info.st_mode) and info.st_uid == 0 and not info.st_mode & 0o022 and os.access(binary, os.X_OK), "Trusted systemd relay binary required")
        for name in TCP_RELAYS:
            port = self.ports[name]
            relay = {"name": name, "port": port, "identity": None}
            self.state.setdefault("tcp_relays", []).append(relay)
            self.save()
            with defer_cancellation():
                process = self.start(tcp_relay_command(name, port, self.state["endpoint_snapshot"]), "tcp-relay-" + name, setup_user=True)
                relay["identity"] = dict(self.state["processes"][-1])
                self.save()
            until = time.monotonic() + 10
            while True:
                require(process.poll() is None, "Owned TCP relay failed to start")
                raw = self.relay_listener_output(port)
                if raw.strip():
                    tcp_listener(raw, port, process.pid)
                    break
                require(time.monotonic() < until, "Owned TCP relay listener deadline reached")
                time.sleep(.1)
            probe = "import socket,sys; socket.create_connection(('127.0.0.1',int(sys.argv[1])),2).close()"
            checked(self.runtime_prefix() + ["python3", "-I", "-c", probe, str(port)], timeout=5)
            while (Path("/proc") / str(process.pid) / "exe").resolve() != SOCKET_PROXY:
                require(process.poll() is None and time.monotonic() < until, "Owned TCP relay activation failed")
                time.sleep(.1)
            self.inspect_tcp_relay(relay)

    def start_services(self):
        process = self.start(self.compose_command("up", "-d", "--pull", "never"), "compose-up")
        self.wait(process, 180)
        self.inspect_containers(running=True)
        self.start_tcp_relays()
        self.monitor = True
        self.save()
        samples = []
        until = time.monotonic() + 180
        while len(samples) < 3:
            self.tick()
            try:
                health = local_json(f"http://127.0.0.1:{self.ports['provider']}/api/health")
                require(provider_healthy(health))
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
        self.runtime_env.update(BUNDLE_PATH=str(self.args.app / "vendor/bundle"), BUNDLE_FROZEN="1", BUNDLE_APP_CONFIG=str(self.op / "home/.bundle"))
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
        require(self.spec.is_file())
        self.wait(self.start([str(self.args.bundle), "exec", "rspec", str(self.spec), "--format", "progress"], "functional", runtime=True, cwd=self.args.app), max(1, 1500 - int(time.monotonic() - self.started)))

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
        try:
            self.require_stopped_tcp_relays()
        except Exception:
            errors.append("tcp_relay_cleanup")
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
                require(app == self.op / "app" and not app.is_symlink())
                for directory, directories, files in os.walk(app, followlinks=False):
                    for path in [Path(directory), *(Path(directory) / name for name in directories + files)]:
                        if path.lstat().st_uid == self.state["uid"]:
                            os.chown(path, self.state["setup_uid"], self.state["setup_gid"], follow_symlinks=False)
            except Exception:
                errors.append("staged_app_ownership_cleanup")
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
        if "failed_command" in self.state:
            try:
                validate_command_failure(self.state["failed_command"])
            except RuntimeError:
                receipt["evidence_rejections"].append("invalid_command_failure")
            else:
                receipt["failed_command"] = dict(self.state["failed_command"])
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
        run, attempt = os.environ.get("GITHUB_RUN_ID", ""), os.environ.get("GITHUB_RUN_ATTEMPT", "")
        require(all(re.fullmatch(r"[1-9][0-9]{0,19}", value) for value in (run, attempt)))
        require(args.work == Path(f"/var/tmp/miru-documenso-live-{run}-{attempt}"))
        if not args.cleanup:
            require(all(getattr(args, name) is not None and getattr(args, name).is_absolute() for name in ("app", "artifact", "source", "ruby", "bundle", "node", "pnpm", "brave")))
            require(args.app == Path(os.environ["GITHUB_WORKSPACE"]) / "qa-public-miru" and not args.app.is_symlink())
            require(args.artifact.name == IMAGE_ASSET_NAME)
            for name in ("ruby", "bundle", "node", "pnpm", "brave"):
                require(getattr(args, name).is_file() and os.access(getattr(args, name), os.X_OK))
    return args


def self_check():
    require(__debug__, "Assertions required")
    healthy = {"status": "ok", "timestamp": "2026-11-16T00:00:00.000Z", "checks": {"database": {"status": "ok"}, "certificate": {"status": "ok"}}}
    assert provider_healthy(healthy)
    for invalid in (None, [], "ok", {}, {"status": "ok", "database": "ok", "certificate": "ok"},
                    {**healthy, "status": "warning"}, {**healthy, "checks": None}, {**healthy, "checks": []},
                    *({**healthy, "checks": {**healthy["checks"], name: value}} for name in ("database", "certificate")
                      for value in (None, "ok", {}, {"status": "warning"}, {"status": "error"})),
                    *({**healthy, "checks": {name: {"status": "ok"}}} for name in ("database", "certificate"))):
        assert not provider_healthy(invalid)
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
        failure_fixture = Lifecycle(argparse.Namespace(work=root / "failed-wait"))
        (failure_fixture.setup / "private-logs").mkdir(parents=True)
        failure_log = failure_fixture.setup / "private-logs/schema.log"
        private(failure_log, b"PRIVATE_DIAGNOSTIC_MARKER PG::ConnectionBad: private details")
        original_fstat = os.fstat
        def root_owned_log(descriptor):
            metadata = list(original_fstat(descriptor))
            metadata[4] = 0
            return os.stat_result(metadata)
        with patch.object(os, "fstat", side_effect=root_owned_log):
            for category, markers in COMMAND_FAILURE_MARKERS.items():
                failure_log.write_bytes(b"PRIVATE_DIAGNOSTIC_MARKER " + markers[0])
                assert command_failure_category(failure_log) == category
            failure_log.write_bytes(b"PG::ConnectionBad" + b"x" * 65536 + b"\nBundler::GemNotFound: PRIVATE_DIAGNOSTIC_MARKER")
            assert command_failure_category(failure_log) == "bundler"
            failure_log.write_bytes(b"PRIVATE_DIAGNOSTIC_MARKER unknown error")
            assert command_failure_category(failure_log) == "unclassified"
        for index, value in ((0, stat.S_IFREG | 0o640), (0, stat.S_IFDIR | 0o600), (3, 2), (4, 1)):
            metadata = list(failure_log.stat())
            metadata[4] = 0
            metadata[index] = value
            with patch.object(os, "fstat", return_value=os.stat_result(metadata)):
                assert command_failure_category(failure_log) == "unavailable"
        log_link = root / "log-link"
        log_link.symlink_to(failure_log)
        assert command_failure_category(log_link) == command_failure_category(root / "missing-log") == "unavailable"
        failure_fixture.save = Mock()
        failure_fixture.wait(argparse.Namespace(poll=lambda: 0, returncode=0, _qa_label="schema"), 1)
        assert "failed_command" not in failure_fixture.state
        failure_fixture.save.assert_not_called()
        failure_log.write_bytes(b"PG::ConnectionBad: PRIVATE_DIAGNOSTIC_MARKER")
        with patch.object(os, "fstat", side_effect=root_owned_log):
            try:
                failure_fixture.wait(argparse.Namespace(poll=lambda: 1, returncode=1, _qa_label="schema"), 1)
            except RuntimeError as error:
                assert str(error) == "Owned command failed"
            else:
                raise AssertionError("Failed command accepted")
        failed_command = {"label": "schema", "returncode": 1, "category": "pg"}
        assert failure_fixture.state["failed_command"] == failed_command
        failure_fixture.save.assert_called_once()
        invalid_failures = [None, [], {**failed_command, "private": "PRIVATE_DIAGNOSTIC_MARKER"}]
        invalid_failures.extend({**failed_command, key: value} for key, value in (
            ("label", "PRIVATE_DIAGNOSTIC_MARKER"), ("label", []), ("returncode", True), ("returncode", 0),
            ("returncode", 256), ("returncode", -65), ("returncode", "PRIVATE_DIAGNOSTIC_MARKER"),
            ("category", "PRIVATE_DIAGNOSTIC_MARKER"), ("category", [])))
        for invalid in invalid_failures:
            try:
                validate_command_failure(invalid)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unlisted command diagnostic accepted")
        project, operation = "miru-live-" + "a" * 16, "miru-live-" + "a" * 16
        network_name = project + "_qa_internal"
        network = {"id": "1" * 64, "name": network_name, "driver": "bridge", "internal": True, "ipv6": False, "project": project, "operation": operation,
                   "ipam": {"Driver": "default", "Config": [{"Subnet": "172.22.0.0/16", "Gateway": "172.22.0.1"}]}, "containers": {}}
        rows = []
        for number, service in enumerate(("database", "documenso", "mailpit", "proxy"), 2):
            cid, eid, address = f"{number:064x}", f"{number + 4:064x}", f"172.22.0.{number}"
            name = project + "-" + service + "-1"
            rows.append({"id": cid, "name": "/" + name, "service": service, "networks": {network_name: {"NetworkID": network["id"], "EndpointID": eid, "IPAddress": address, "IPPrefixLen": 16, "GlobalIPv6Address": ""}}})
            network["containers"][cid] = {"Name": name, "EndpointID": eid, "IPv4Address": address + "/16", "IPv6Address": ""}
        snapshot = endpoint_snapshot(rows, network, project, operation)
        assert endpoint_snapshot(rows, network, project, operation, snapshot) == snapshot
        invalid_networks = [{**network, key: value} for key, value in (("driver", "host"), ("internal", False), ("ipv6", True), ("operation", "foreign"), ("project", "foreign"), ("id", "2" * 64))]
        invalid_networks.extend(({**network, "containers": {**network["containers"], "f" * 64: {}}},
                                 {**network, "ipam": {"Driver": "default", "Config": [{"Subnet": "203.0.113.0/24"}]}},
                                 {**network, "containers": {cid: row for cid, row in network["containers"].items() if cid != rows[0]["id"]}}))
        for invalid in invalid_networks:
            try:
                endpoint_snapshot(rows, invalid, project, operation)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unowned or noninternal relay network accepted")
        for fault in ("network", "endpoint", "membership", "duplicate", "drift"):
            changed_rows, changed_network = json.loads(json.dumps(rows)), json.loads(json.dumps(network))
            endpoint = changed_rows[0]["networks"][network_name]
            record = changed_network["containers"][changed_rows[0]["id"]]
            if fault == "network":
                endpoint["NetworkID"] = "f" * 64
            elif fault == "endpoint":
                record["EndpointID"] = "f" * 64
            elif fault == "membership":
                changed_rows[0]["networks"]["foreign"] = dict(endpoint)
            else:
                endpoint["IPAddress"] = rows[1]["networks"][network_name]["IPAddress"] if fault == "duplicate" else "172.22.0.50"
                record["IPv4Address"] = endpoint["IPAddress"] + "/16"
            try:
                endpoint_snapshot(changed_rows, changed_network, project, operation, snapshot if fault == "drift" else None)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Changed relay endpoint accepted")
        for number, (key, service, target) in enumerate((("pg", "database", 5432), ("smtp", "mailpit", 1025), ("provider", "proxy", 8080), ("mailpit", "proxy", 8081))):
            assert tcp_relay_command(key, 20000 + number, snapshot) == [str(SOCKET_ACTIVATE), f"--listen=127.0.0.1:{20000 + number}", str(SOCKET_PROXY), "--connections-max=32", snapshot["endpoints"][service]["address"] + ":" + str(target)]
        listener = b'LISTEN 0 4096 127.0.0.1:20000 0.0.0.0:* users:(("systemd-socket-",pid=456,fd=3))\n'
        tcp_listener(listener, 20000, 456)
        for bad in (b"", listener * 2, listener.replace(b"127.0.0.1:20000", b"0.0.0.0:20000"), listener.replace(b"127.0.0.1:20000", b"[::1]:20000"), listener.replace(b"pid=456", b"pid=457")):
            try:
                tcp_listener(bad, 20000, 456)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unowned or wildcard relay listener accepted")
        principal = b"Uid:\t1001 1001 1001 1001\nGid:\t1002 1002 1002 1002\nGroups:\nNoNewPrivs:\t1\n" + b"".join(key + b":\t0000000000000000\n" for key in (b"CapInh", b"CapPrm", b"CapEff", b"CapBnd", b"CapAmb"))
        relay_principal(principal, 1001, 1002)
        invalid_principals = [principal.replace(b"1001", b"0"), principal.replace(b"1002", b"0"), principal.replace(b"Groups:\n", b"Groups:\t0\n"), principal.replace(b"NoNewPrivs:\t1", b"NoNewPrivs:\t0")]
        invalid_principals.extend(principal.replace(key + b":\t0000000000000000", key + b":\t0000000000000001") for key in (b"CapInh", b"CapPrm", b"CapEff", b"CapBnd", b"CapAmb"))
        for bad in invalid_principals:
            try:
                relay_principal(bad, 1001, 1002)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Privileged TCP relay accepted")
        relay_fixture = Lifecycle(argparse.Namespace(work=root / "relay-fixture"))
        relay_fixture.state.update(setup_uid=1001, setup_gid=1002, gid=902, endpoint_snapshot=snapshot)
        relay_fixture.uid, relay_fixture.gid = 902, 902
        relay_fixture.setup.mkdir(parents=True)
        (relay_fixture.setup / "private-logs").mkdir()
        relay_fixture.save = Mock()
        child = Mock(pid=456)
        with patch.object(subprocess, "Popen", return_value=child) as spawn, patch.dict(globals(), process_identity=Mock(return_value={"pid": 456, "start": "123", "uid": 0})):
            relay_fixture.start(["synthetic-never-executed"], "setup-principal", setup_user=True)
            assert spawn.call_args.args[0] == principal_prefix(1001, 902) + ["synthetic-never-executed"]
            assert spawn.call_args.kwargs["env"] == BASE_ENV
        identity = relay_fixture.state["processes"][-1]
        assert identity == {"pid": 456, "start": "123", "uid": 1001}
        try:
            relay_fixture.start([], "ambiguous", runtime=True, setup_user=True)
        except RuntimeError:
            pass
        else:
            raise AssertionError("Ambiguous relay principal accepted")
        with patch.dict(globals(), checked=Mock(return_value=b"")):
            relay_fixture.check_authority(1001, 902)
            command = checked.call_args.args[0]
            assert command[:len(principal_prefix(1001, 902))] == principal_prefix(1001, 902) and command[-2:] == ["1001", "902"]
            authority_probe = command[command.index("-c") + 1]
        with patch.object(subprocess, "Popen", return_value=Mock(pid=457)), patch.dict(globals(), process_identity=Mock(return_value={"pid": 457, "start": "124", "uid": 777})):
            try:
                relay_fixture.start(["synthetic-never-executed"], "wrong-observed-principal", setup_user=True)
            except RuntimeError:
                assert relay_fixture.state["processes"] == [identity]
            else:
                raise AssertionError("Unexpected live relay UID accepted")
        for exposed in (None, "sudo", "unix", "tcp"):
            sockets = [Mock() for _ in range(4)]
            for number, stream in enumerate(sockets):
                stream.connect.side_effect = None if (exposed == "unix" and number == 0) or (exposed == "tcp" and number == 2) else OSError(errno.EACCES if number < 2 else errno.ECONNREFUSED, "synthetic denial")
            with patch.object(os, "getuid", return_value=1001), patch.object(os, "getgid", return_value=902), patch.object(os, "getgroups", return_value=[]), patch.object(sys, "argv", ["probe", "1001", "902"]), patch.object(subprocess, "run", return_value=Mock(returncode=0 if exposed == "sudo" else 1)), patch.object(socket, "socket", side_effect=sockets):
                try:
                    exec(compile(authority_probe, "synthetic-authority-probe", "exec"), {})
                except AssertionError:
                    assert exposed is not None
                else:
                    assert exposed is None
                    assert [stream.connect.call_args.args[0] for stream in sockets] == ["/var/run/docker.sock", "/run/containerd/containerd.sock", ("127.0.0.1", 2375), ("127.0.0.1", 2376)]
        with patch.object(relay_fixture, "check_authority", side_effect=subprocess.CalledProcessError(1, ["synthetic-authority-probe"])) as authority, patch.object(Path, "lstat", side_effect=AssertionError("Relay started before authority admission")):
            try:
                relay_fixture.start_tcp_relays()
            except subprocess.CalledProcessError:
                authority.assert_called_once_with(1001, 902)
            else:
                raise AssertionError("Exposed relay principal admitted")
        relay_fixture.state["tcp_relays"] = [{"name": "pg", "port": 20000, "identity": identity}]
        relay = relay_fixture.state["tcp_relays"][0]
        relay_fixture.relay_listener_output = Mock(return_value=listener)
        expected_cmdline = b"\0".join(os.fsencode(value) for value in tcp_relay_command("pg", 20000, snapshot)[2:]) + b"\0"
        for cmdline, refused in ((expected_cmdline, False), (expected_cmdline.replace(b":5432", b":3000"), True), (expected_cmdline + b"extra\0", True), (expected_cmdline[:-1], True)):
            with patch.dict(globals(), process_identity=Mock(return_value=identity), read_regular=Mock(side_effect=[principal.replace(b"1002", b"902"), cmdline])), patch.object(Path, "resolve", return_value=SOCKET_PROXY):
                try:
                    relay_fixture.inspect_tcp_relay(relay)
                except RuntimeError:
                    assert refused
                else:
                    assert not refused
        relay_fixture.handles = []
        for actual, output, refused in ((None, b"", False), (identity, b"", True), (None, listener.replace(b"pid=456", b"pid=457"), True)):
            relay_fixture.relay_listener_output = Mock(return_value=output)
            with patch.dict(globals(), process_identity=Mock(return_value=actual)), patch.object(os, "killpg", side_effect=AssertionError("Foreign relay was killed")), patch.object(time, "monotonic", side_effect=[0, 6]), patch.object(time, "sleep", side_effect=AssertionError("Unbounded cleanup wait")):
                try:
                    relay_fixture.require_stopped_tcp_relays()
                except RuntimeError:
                    assert refused
                else:
                    assert not refused
        relay_fixture.relay_listener_output = Mock(side_effect=[listener, b"", b""])
        with patch.dict(globals(), process_identity=Mock(side_effect=[identity, identity, None])), patch.object(time, "monotonic", side_effect=[0, 1, 2]), patch.object(time, "sleep") as sleep:
            relay_fixture.require_stopped_tcp_relays()
            assert sleep.call_count == 2 and not relay_fixture.handles
        with patch.object(Path, "read_text", side_effect=["456 (synthetic) " + " ".join(["S"] + ["0"] * 18 + ["123"]), FileNotFoundError("Synthetic process exited")]):
            assert process_identity(456) is None
        journal = root / "state.json"
        private(journal, b'{"schema_version":1}')
        for uid, mode, nlink in ((0, 0o600, 1), (1, 0o600, 1), (0, 0o640, 1), (0, 0o600, 2)):
            metadata = list(journal.stat())
            metadata[0], metadata[3], metadata[4] = stat.S_IFREG | mode, nlink, uid
            with patch.object(os, "fstat", return_value=os.stat_result(metadata)):
                try:
                    data = read_regular(journal, 1024, private_journal=True)
                except RuntimeError:
                    assert (uid, mode, nlink) != (0, 0o600, 1)
                else:
                    assert (uid, mode, nlink) == (0, 0o600, 1) and data == b'{"schema_version":1}'
        try:
            read_regular(link, 1024, private_journal=True)
        except OSError:
            pass
        else:
            raise AssertionError("Cleanup journal symlink followed")
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
        with patch.object(subprocess, "run", side_effect=subprocess.CalledProcessError(1, ["SYNTHETIC_SECRET_COMMAND"])):
            try:
                expected_line = sys._getframe().f_lineno + 1
                checked(["SYNTHETIC_SECRET_COMMAND"])
            except subprocess.CalledProcessError as error:
                assert diagnostic(error) == f"Functional QA refused or failed (CalledProcessError, adapter_line={expected_line}); only sanitized evidence may be uploaded\n"
        runner, workspace = root / "runner", root / "workspace"
        binaries = root / "bin"
        binaries.mkdir()
        work = Path("/var/tmp/miru-documenso-live-123-2")
        argv = ["--app", str(workspace / "qa-public-miru"), "--work", str(work),
                "--artifact", str(runner / "documenso-inputs" / IMAGE_ASSET_NAME),
                "--source", str(runner / "documenso-inputs/source")]
        for name in ("ruby", "bundle", "node", "pnpm", "brave"):
            binary = binaries / ("brave-browser" if name == "brave" else name)
            binary.write_bytes(b"synthetic parser fixture; never executed")
            binary.chmod(0o700)
            argv.extend(("--" + name, str(binary)))
        with patch.dict(os.environ, {"RUNNER_TEMP": str(runner), "GITHUB_WORKSPACE": str(workspace), "GITHUB_RUN_ID": "123", "GITHUB_RUN_ATTEMPT": "2"}, clear=True):
            assert parse_args(argv).artifact == runner / "documenso-inputs" / IMAGE_ASSET_NAME
            assert parse_args(["--cleanup", "--work", str(work)]).work == work
            for wrong_work in ("/var/tmp/miru-documenso-live-124-2", "/var/tmp/miru-documenso-live-123-3", str(runner / "miru-documenso-live")):
                try:
                    parse_args(["--cleanup", "--work", wrong_work])
                except RuntimeError:
                    pass
                else:
                    raise AssertionError("Work path from another run accepted")
            for invalid_id in ("", "../123", "123\n", "0"):
                with patch.dict(os.environ, {"GITHUB_RUN_ID": invalid_id}):
                    try:
                        parse_args(["--cleanup", "--work", str(work)])
                    except RuntimeError:
                        pass
                    else:
                        raise AssertionError("Invalid run identity accepted")
            old_name = list(argv)
            old_name[old_name.index("--artifact") + 1] = str(runner / "documenso-inputs/provider.complete.zip")
            try:
                parse_args(old_name)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Historical transport filename accepted")
        source = root / "public-source"
        source.mkdir()
        fixture_env = {**GIT_ENV, "GIT_AUTHOR_NAME": "Synthetic", "GIT_AUTHOR_EMAIL": "qa@miru-qa.invalid", "GIT_COMMITTER_NAME": "Synthetic", "GIT_COMMITTER_EMAIL": "qa@miru-qa.invalid"}
        checked(["git", "-c", "init.templateDir=", "init", str(source)], env=fixture_env)
        public = {"Gemfile": b"# $Format:%H$\r\n", "bin/run": b"#!/bin/sh\nexit 0\n", ".gitignore": b"private-marker\nnode_modules/\nvendor/\n", ".gitattributes": b"Gemfile export-subst filter=blocked\n"}
        for name, data in public.items():
            private(source / name, data)
            (source / name).chmod(0o755 if name == "bin/run" else 0o644)
        checked([*source_git(source), "add", "."], env=fixture_env)
        checked([*source_git(source), "-c", "core.hooksPath=/dev/null", "commit", "-m", "Synthetic public source"], env=fixture_env)
        fixture_head = checked([*source_git(source), "rev-parse", "HEAD"], env=fixture_env).decode().strip()
        real_popen, real_timer_start, real_timer_join = subprocess.Popen, threading.Timer.start, threading.Timer.join
        for cancellation in (False, True):
            children, timers = [], []
            def tracked_popen(*args, **kwargs):
                child = real_popen(*args, **kwargs)
                children.append(child)
                return child
            def interrupted_timer_start(timer):
                timers.append(timer)
                if not cancellation:
                    raise RuntimeError("Synthetic timer start failure")
                real_timer_start(timer)
                interrupted(signal.SIGTERM, None)
            def started_timer_join(timer, *args, **kwargs):
                assert timer.ident is not None, "Unstarted timer joined"
                return real_timer_join(timer, *args, **kwargs)
            with patch.dict(globals(), HEAD=fixture_head), patch.object(subprocess, "Popen", side_effect=tracked_popen), patch.object(threading.Timer, "start", new=interrupted_timer_start), patch.object(threading.Timer, "join", new=started_timer_join):
                try:
                    stage_source(source, root / ("canceled-source" if cancellation else "failed-timer-source"))
                except (RuntimeError, SystemExit) as error:
                    assert (isinstance(error, SystemExit) and error.code == 128 + signal.SIGTERM) if cancellation else str(error) == "Synthetic timer start failure"
                else:
                    raise AssertionError("Source reader fault was ignored")
            assert len(children) == 2 and all(child.returncode is not None and child.stdout.closed for child in children)
            assert len(timers) == 1 and not timers[0].is_alive()
        for key, value in (("filter.blocked.clean", "false"), ("filter.blocked.smudge", "false"), ("filter.blocked.required", "true")):
            checked([*source_git(source), "config", key, value], env=fixture_env)
        private(source / "private-marker", b"private fixture; must never be copied")
        private(source / "node_modules/package/index.js", b"public node fixture")
        (source / "node_modules/linked").symlink_to("package", target_is_directory=True)
        private(source / "vendor/bundle/gems/fixture.rb", b"public gem fixture")
        pnpm = root / "public-pnpm"
        private(pnpm / "package.json", b'{"name":"pnpm"}')
        private(pnpm / "bin/pnpm.cjs", b"#!/usr/bin/env node\nrequire('../dist/main.cjs')\n")
        (pnpm / "bin/pnpm.cjs").chmod(0o755)
        private(pnpm / "dist/main.cjs", b"public pnpm fixture")
        pnpm_shim = root / "pnpm-shim"
        pnpm_shim.symlink_to(pnpm / "bin/pnpm.cjs")
        original = {name: ((source / name).read_bytes(), stat.S_IMODE((source / name).stat().st_mode), (source / name).stat().st_uid) for name in public}
        staged = root / "staged-inputs"
        staged.mkdir()
        with patch.dict(globals(), HEAD=fixture_head):
            staged_app, staged_cli = stage_inputs(source, pnpm_shim, staged)
        assert {str(path.relative_to(staged_app)) for path in staged_app.rglob("*") if path.is_file() and not path.is_symlink()} == set(public) | {"node_modules/package/index.js", "vendor/bundle/gems/fixture.rb"}
        assert not (staged_app / ".git").exists() and not (staged_app / "private-marker").exists()
        assert all((staged_app / name).read_bytes() == data for name, data in public.items())
        assert stat.S_IMODE((staged_app / "bin/run").stat().st_mode) == 0o755
        assert (staged_app / "node_modules/linked").is_symlink()
        assert staged_cli == staged / "pnpm/bin/pnpm" and staged_cli.is_symlink() and staged_cli.read_bytes() == (pnpm / "bin/pnpm.cjs").read_bytes()
        assert (staged / "pnpm/dist/main.cjs").read_bytes() == (pnpm / "dist/main.cjs").read_bytes()
        assert original == {name: ((source / name).read_bytes(), stat.S_IMODE((source / name).stat().st_mode), (source / name).stat().st_uid) for name in public}
        escape = staged_app / "node_modules/escape"
        escape.symlink_to(source / "private-marker")
        with patch.object(Path, "read_bytes", side_effect=AssertionError("Escaping link was read")):
            try:
                contained_links(staged_app)
            except RuntimeError:
                pass
            else:
                raise AssertionError("Escaping dependency symlink accepted")
        escape.unlink()
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
        fake.op = root / "diagnostic-operation"
        (fake.op / "output").mkdir(parents=True)
        fake.state.update(runtime_processes_stopped=True, failed_command=failed_command)
        fake.output = fake.work / "diagnostic"
        with patch.dict(globals(), uid_processes=lambda uid: []):
            assert fake.export_evidence(False)
            diagnostic = read_regular(fake.output / "lifecycle.json", 65536)
            assert json.loads(diagnostic)["failed_command"] == failed_command and b"PRIVATE_DIAGNOSTIC_MARKER" not in diagnostic
            for number, invalid in enumerate(invalid_failures):
                fake.output = fake.work / ("invalid-diagnostic-" + str(number))
                fake.state["failed_command"] = invalid
                assert not fake.export_evidence(False)
                diagnostic = read_regular(fake.output / "lifecycle.json", 65536)
                assert "failed_command" not in json.loads(diagnostic) and b"PRIVATE_DIAGNOSTIC_MARKER" not in diagnostic
                assert json.loads(diagnostic)["evidence_rejections"] == ["invalid_command_failure"]
        header = "Num RefCount Protocol Flags Type St Inode Path\n"
        filesystem = (header + "0: 00000001 00000000 00010000 0001 01 900 /run/snapd.socket\n" +
                      "1: 00000001 00000000 00000000 0002 01 901 /run/journal-socket\n" +
                      "2: 00000002 00000000 00000000 0001 03 902 /run/connected-client\n").encode()
        listeners = unix_listeners(filesystem)
        assert listeners == [(900, "/run/snapd.socket", 1), (901, "/run/journal-socket", 2)]
        assert unix_admission_paths(listeners) == {"/run/snapd.socket", "/run/journal-socket"}
        jobs = Mock(side_effect=[b"pending startup job\n", b""])
        with patch.dict(globals(), checked=jobs), patch.object(time, "sleep") as sleep:
            wait_runner_jobs()
            assert jobs.call_count == 2
            sleep.assert_called_once_with(.2)
        with patch.dict(globals(), checked=Mock(return_value=b"pending startup job\n")), patch.object(time, "monotonic", side_effect=[0, 31]), patch.object(time, "sleep") as sleep:
            try:
                wait_runner_jobs()
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unsettled runner accepted")
            sleep.assert_not_called()
        assert required_access_failures(json.dumps([True] * 7)) == []
        assert required_access_failures(json.dumps([True, False, True, True, True, False, True])) == ["spec", "pnpm"]
        for malformed in ([True] * 6, [True] * 8, [True] * 6 + [1], [True] * 6 + ["SYNTHETIC_SECRET"], {"SYNTHETIC_SECRET": True}):
            try:
                required_access_failures(json.dumps(malformed))
            except RuntimeError:
                pass
            else:
                raise AssertionError("Unreviewed runtime access flags accepted")
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
        if not lifecycle.state_path.exists() and not lifecycle.state_path.is_symlink():
            return 0
        state = json.loads(read_regular(lifecycle.state_path, 1024**2, private_journal=True), object_pairs_hook=unique_object)
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
    git = source_git(args.app)
    require(checked([*git, "rev-parse", "HEAD"], env=GIT_ENV).decode().strip() == HEAD)
    require(checked([*git, "rev-parse", "HEAD^{tree}"], env=GIT_ENV).decode().strip() == TREE)
    require(not checked([*git, "status", "--porcelain"], env=GIT_ENV).strip())
    handlers = {sig: signal.signal(sig, interrupted) for sig in (signal.SIGTERM, signal.SIGINT, signal.SIGALRM)}
    signal.setitimer(signal.ITIMER_REAL, max(.1, 1490 - (time.monotonic() - lifecycle.started)))
    passed = False
    cleaned = False
    evidence_ok = False
    try:
        docker_root = Path(json.loads(lifecycle.docker("info", "--format", '{"root":{{json .DockerRootDir}}}'))["root"])
        capacity(args.work, docker_root)
        mount_options = checked(["findmnt", "--noheadings", "--output", "OPTIONS", "--target", str(args.work)]).decode().strip().split(",")
        require(mount_options != [""] and "noexec" not in mount_options, "QA work filesystem must allow native dependencies")
        lifecycle.prepare_user()
        lifecycle.save()
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
