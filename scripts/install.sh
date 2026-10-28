#!/usr/bin/env bash
# Install prebuilt oxmcp from GitHub Releases into ~/.local/bin (or OXMCP_INSTALL_DIR).
set -euo pipefail

REPO="${OXMCP_REPO:-assertnotnull/oxmcp}"
VERSION="${OXMCP_VERSION:-latest}"
INSTALL_DIR="${OXMCP_INSTALL_DIR:-${HOME}/.local/bin}"

err() {
  echo "oxmcp install: $*" >&2
}

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "missing required command: $1"
    exit 1
  fi
}

detect_asset() {
  local os arch
  os="$(uname -s)"
  arch="$(uname -m)"
  case "${os}:${arch}" in
    Linux:x86_64) echo "oxmcp-linux-x64" ;;
    Linux:amd64) echo "oxmcp-linux-x64" ;;
    Darwin:arm64) echo "oxmcp-darwin-arm64" ;;
    Darwin:x86_64) echo "oxmcp-darwin-x64" ;;
    *)
      err "unsupported platform: ${os} ${arch}"
      err "supported: linux x64, macOS arm64, macOS x64"
      exit 1
      ;;
  esac
}

resolve_version_tag() {
  if [[ "${VERSION}" == "latest" ]]; then
    need_cmd curl
    local json tag
    json="$(
      curl -fsSL \
        -H "Accept: application/vnd.github+json" \
        -H "User-Agent: oxmcp-install-script" \
        "https://api.github.com/repos/${REPO}/releases/latest"
    )"
    if command -v python3 >/dev/null 2>&1; then
      tag="$(printf '%s' "${json}" | python3 -c "import json,sys; print(json.load(sys.stdin)['tag_name'])")"
    else
      tag="$(printf '%s' "${json}" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
    fi
    if [[ -z "${tag}" ]]; then
      err "could not resolve latest release for ${REPO}"
      exit 1
    fi
    echo "${tag}"
  else
    if [[ "${VERSION}" == v* ]]; then
      echo "${VERSION}"
    else
      echo "v${VERSION}"
    fi
  fi
}

verify_sha256() {
  local sums_file="$1"
  local dir="$2"
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "${dir}" && sha256sum -c "${sums_file}")
  elif command -v shasum >/dev/null 2>&1; then
    (cd "${dir}" && shasum -a 256 -c "${sums_file}")
  else
    err "missing sha256sum or shasum; cannot verify download"
    exit 1
  fi
}

main() {
  need_cmd curl
  need_cmd chmod
  need_cmd mkdir

  local asset tag tmp sums_url bin_url dest
  asset="$(detect_asset)"
  tag="$(resolve_version_tag)"
  tmp="$(mktemp -d)"
  trap 'rm -rf "${tmp}"' EXIT

  sums_url="https://github.com/${REPO}/releases/download/${tag}/SHA256SUMS"
  bin_url="https://github.com/${REPO}/releases/download/${tag}/${asset}"

  echo "Installing oxmcp ${tag} (${asset}) -> ${INSTALL_DIR}/oxmcp"

  curl -fsSL -o "${tmp}/SHA256SUMS" "${sums_url}"
  curl -fsSL -o "${tmp}/${asset}" "${bin_url}"

  verify_sha256 "SHA256SUMS" "${tmp}"

  mkdir -p "${INSTALL_DIR}"
  dest="${INSTALL_DIR}/oxmcp"
  chmod +x "${tmp}/${asset}"
  mv "${tmp}/${asset}" "${dest}"

  echo ""
  echo "Installed: ${dest}"
  if ! command -v oxmcp >/dev/null 2>&1; then
    case ":${PATH}:" in
      *":${INSTALL_DIR}:"*) ;;
      *)
        echo "Add ${INSTALL_DIR} to your PATH if oxmcp is not found."
        ;;
    esac
  fi
  echo ""
  echo "MCP client snippet:"
  "${dest}" print-mcp-config
  echo ""
  echo "Upgrade later by re-running this install script."
}

main "$@"
