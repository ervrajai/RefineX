from django.db import migrations


LEGACY_COLUMNS = [
    "profile_picture",
    "social_id",
    "is_email_verified",
    "password_last_updated",
]


def drop_legacy_columns(apps, schema_editor):
    table_names = schema_editor.connection.introspection.table_names()
    if "accounts_user" not in table_names:
        return

    with schema_editor.connection.cursor() as cursor:
        columns = {
            column.name
            for column in schema_editor.connection.introspection.get_table_description(
                cursor,
                "accounts_user",
            )
        }

    for column in LEGACY_COLUMNS:
        if column in columns:
            schema_editor.execute(f"ALTER TABLE accounts_user DROP COLUMN {column}")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_repair_legacy_customuser_table"),
    ]

    operations = [
        migrations.RunPython(drop_legacy_columns, migrations.RunPython.noop),
    ]
