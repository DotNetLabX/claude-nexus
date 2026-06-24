# Toolchain image for the Mine->Verify->Cover C++ adapter probe.
# Ubuntu 22.04 (jammy) + Clang/LLVM 15 + mull-15 (0.34.0) + GoogleTest + libclang(py).
# NOTE: on jammy the Cloudsmith mull-stable repo ships mull up to LLVM 15 (mull-11/13/14/15),
# NOT mull-18 — so the clang/mull majors are pinned to 15. Source is volume-mounted at run time.
FROM ubuntu:22.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \
      curl ca-certificates gnupg \
      cmake ninja-build git make python3 python3-pip libgtest-dev \
      clang-15 llvm-15 \
    && rm -rf /var/lib/apt/lists/*

# mull 15 from the official Cloudsmith repo (matching the clang-15 major)
RUN curl -1sLf 'https://dl.cloudsmith.io/public/mull-project/mull-stable/setup.deb.sh' | bash \
    && apt-get update && apt-get install -y mull-15 \
    && rm -rf /var/lib/apt/lists/*

# libclang Python bindings (clang.cindex) for the evidence-indexer step
RUN pip3 install --no-cache-dir libclang

ENV CC=clang-15 CXX=clang++-15
WORKDIR /probe
CMD ["bash"]
