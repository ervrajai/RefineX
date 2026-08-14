#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "==> Upgrading pip and installing backend dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "==> Collecting static files..."
python manage.py collectstatic --noinput

echo "==> Running database migrations..."
python manage.py migrate
