from django.db import migrations


def repair_legacy_customuser_table(apps, schema_editor):
    existing_tables = schema_editor.connection.introspection.table_names()

    if "accounts_user" not in existing_tables and "accounts_customuser" in existing_tables:
        schema_editor.execute("ALTER TABLE accounts_customuser RENAME TO accounts_user")

    existing_tables = schema_editor.connection.introspection.table_names()

    if "accounts_user_groups" not in existing_tables and "accounts_customuser_groups" in existing_tables:
        schema_editor.execute("ALTER TABLE accounts_customuser_groups RENAME TO accounts_user_groups")
        _rename_column_if_exists(schema_editor, "accounts_user_groups", "customuser_id", "user_id")

    existing_tables = schema_editor.connection.introspection.table_names()

    if (
        "accounts_user_user_permissions" not in existing_tables
        and "accounts_customuser_user_permissions" in existing_tables
    ):
        schema_editor.execute(
            "ALTER TABLE accounts_customuser_user_permissions RENAME TO accounts_user_user_permissions"
        )
        _rename_column_if_exists(schema_editor, "accounts_user_user_permissions", "customuser_id", "user_id")


def _rename_column_if_exists(schema_editor, table_name, old_name, new_name):
    columns = {
        column.name
        for column in schema_editor.connection.introspection.get_table_description(
            schema_editor.connection.cursor(),
            table_name,
        )
    }
    if old_name in columns and new_name not in columns:
        schema_editor.execute(f"ALTER TABLE {table_name} RENAME COLUMN {old_name} TO {new_name}")


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0001_initial"),
    ]

    run_before = [
        ("account", "0006_emailaddress_lower"),
    ]

    operations = [
        migrations.RunPython(repair_legacy_customuser_table, migrations.RunPython.noop),
    ]
