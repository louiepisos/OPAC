#!/usr/bin/env bash
set -Eeo pipefail

cd /var/www/html

log() {
    printf '[opac-entrypoint] %s\n' "$*"
}

warn() {
    printf '[opac-entrypoint] WARNING: %s\n' "$*" >&2
}

run_or_warn() {
    local description="$1"
    shift
    log "$description"
    if ! "$@"; then
        warn "$description failed; continuing so the container stays available for debugging. Check the output above."
    fi
    return 0
}

set_env_value() {
    local key="$1"
    local value="$2"
    if [ -z "$value" ] || [ ! -f .env ]; then
        return
    fi
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        printf '\n%s=%s\n' "$key" "$value" >> .env
    fi
}

if [ ! -f .env ] && [ -f .env.example ]; then
    log 'Creating .env from .env.example'
    cp .env.example .env
fi

if [ -f .env ]; then
    log 'Applying Docker environment defaults to .env'
    set_env_value APP_ENV "${APP_ENV:-local}"
    set_env_value APP_DEBUG "${APP_DEBUG:-true}"
    set_env_value APP_URL "${APP_URL:-http://localhost:8080}"
    set_env_value DB_CONNECTION "${DB_CONNECTION:-mysql}"
    set_env_value DB_HOST "${DB_HOST:-db}"
    set_env_value DB_PORT "${DB_PORT:-3306}"
    set_env_value DB_DATABASE "${DB_DATABASE:-opac_db}"
    set_env_value DB_USERNAME "${DB_USERNAME:-opac_user}"
    set_env_value DB_PASSWORD "${DB_PASSWORD:-opac_password}"
fi

if [ ! -f vendor/autoload.php ]; then
    run_or_warn 'Installing Composer dependencies' composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if [ ! -d node_modules ] || [ ! -x node_modules/.bin/vite ]; then
    run_or_warn 'Installing npm dependencies' npm ci
fi

if [ ! -f public/build/manifest.json ]; then
    run_or_warn 'Building frontend assets' npm run build
fi

if [ -f artisan ] && [ -f vendor/autoload.php ]; then
    if ! grep -Eq '^APP_KEY=base64:.+' .env 2>/dev/null; then
        run_or_warn 'Generating Laravel application key' php artisan key:generate --force --no-interaction
    fi
    run_or_warn 'Clearing Laravel config cache' php artisan config:clear --no-interaction
else
    warn 'Skipping artisan setup because artisan or vendor/autoload.php is missing.'
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || warn 'Unable to update storage/cache ownership on this filesystem.'

log "Starting: $*"
exec "$@"
