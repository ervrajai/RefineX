from django.apps import AppConfig
import sys
import subprocess


class VisualizationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.visualization'

    def ready(self):
        self._auto_install_packages()
        self._auto_migrate()

    def _auto_install_packages(self):
        required_packages = ['seaborn', 'networkx']
        installed_packages = []
        for pkg in required_packages:
            try:
                __import__(pkg)
            except ImportError:
                try:
                    subprocess.check_call(
                        [sys.executable, "-m", "pip", "install", pkg],
                        stdout=subprocess.DEVNULL,
                        stderr=subprocess.DEVNULL
                    )
                    installed_packages.append(pkg)
                except Exception as e:
                    print(f"RefineX Auto-Install Error: Failed to install '{pkg}': {e}", file=sys.stderr)
        if installed_packages:
            print(f"RefineX Auto-Installed packages on boot: {installed_packages}")

    def _auto_migrate(self):
        """
        Automatically run outstanding migrations for the visualization app on startup.
        This ensures the SavedGraph table is created without a manual migrate step.
        """
        try:
            from django.db import connection
            from django.db.migrations.executor import MigrationExecutor

            executor = MigrationExecutor(connection)
            plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
            if plan:
                from django.core.management import call_command
                call_command('migrate', '--run-syncdb', verbosity=0)
        except Exception as e:
            # Non-fatal — server still starts, but table may be missing
            print(f"RefineX Auto-Migrate Warning: {e}", file=sys.stderr)
