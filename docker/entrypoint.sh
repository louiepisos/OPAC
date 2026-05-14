#!/usr/bin/env bash
set -e

cd /var/www/html

if [ ! -f .env ] && [ -f .env.example ]; then
    cp .env.example .env
fi

set_env_value() {
    local key="$1"
    local value="$2"
    if [ -z "$value" ]; then
        return
    fi
    if grep -q "^${key}=" .env; then
        sed -i "s|^${key}=.*|${key}=${value}|" .env
    else
        printf '\n%s=%s\n' "$key" "$value" >> .env
    fi
}

if [ -f .env ]; then
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
    composer install --no-interaction --prefer-dist --optimize-autoloader
fi

if [ ! -d node_modules ]; then
    npm ci
fi

if [ ! -f public/build/manifest.json ]; then
    npm run build
fi

if [ -f artisan ]; then
    if ! grep -Eq '^APP_KEY=base64:.+' .env 2>/dev/null; then
        php artisan key:generate --force --no-interaction >/dev/null 2>&1 || true
    fi
    php artisan config:clear --no-interaction >/dev/null 2>&1 || true
fi

chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

exec "$@"
