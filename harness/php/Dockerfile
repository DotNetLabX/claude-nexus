# Toolchain image for the Mine->Verify->Cover PHP adapter (probe + Cover runner).
#
# Base: php:8.4-cli (Debian) + PCOV (the fastest Infection coverage driver — line-only) + composer.
# Infection, PHPUnit 12, and eris are installed PER-WORKSPACE via composer (they need the target's
# autoloader), pinned in composer.json.template — so this image stays target-agnostic and is built once.
#
# TOOLCHAIN REALITY (docs/kb/research/php-mutation-and-test-tooling.md, hands-on confirmed 2026-07-07 by
# the Step-1 probe): current Infection requires PHP ^8.3 + a coverage driver; PCOV is the fastest (line
# coverage only, which is all Infection needs). Single-file mutation is pinned by a POSITIONAL CLI arg;
# Infection's `json` logger is proprietary and is TRANSLATED to the gate's Stryker-shaped schema by the
# Cover runner. See harness/php/cover-php-contract.md.
#
# RUN ON THE CONTAINER'S NATIVE FS, NOT OVER THE BIND MOUNT (Step-1 probe finding). PHP's autoloader
# reads thousands of vendor/ files; over a Windows->Linux bind mount that is ~20x slower (measured:
# 0.42s test logic -> 9.6s wall), and Infection spawns one PHPUnit subprocess PER MUTANT, so every mutant
# blows past the per-process timeout -> 45/45 false "Timed Out". Copy the mounted workspace in first:
#   docker run --rm -v "<host-ws>:/work" mvc-php-probe bash -c \
#     'cp -r /work /native && cd /native && vendor/bin/phpunit && vendor/bin/phpunit \
#        && vendor/bin/infection <target-rel>.php --no-progress --threads=4 \
#        && cp infection-log.json infection-summary.log /work/'
# On native fs the same run is ~0.16s / ~2.5s. See harness/php/cover-php-contract.md "Host reality".
FROM php:8.4-cli

ENV DEBIAN_FRONTEND=noninteractive

# PCOV (pecl) needs the php build deps ($PHPIZE_DEPS is defined by the base image); git + unzip are for
# composer; libzip-dev backs the zip extension composer prefers.
RUN apt-get update && apt-get install -y --no-install-recommends \
      git unzip libzip-dev $PHPIZE_DEPS \
    && pecl install pcov \
    && docker-php-ext-enable pcov \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# composer from the official image (pulled at build time).
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /work
CMD ["bash"]
