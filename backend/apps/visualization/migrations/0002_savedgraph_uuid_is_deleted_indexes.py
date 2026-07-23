import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('visualization', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='savedgraph',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name='savedgraph',
            name='is_deleted',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='savedgraph',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='savedgraph',
            name='user',
            field=models.ForeignKey(blank=True, db_index=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='saved_graphs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddIndex(
            model_name='savedgraph',
            index=models.Index(fields=['user', 'is_deleted'], name='visualizati_user_id_48b29c_idx'),
        ),
        migrations.AddIndex(
            model_name='savedgraph',
            index=models.Index(fields=['uuid'], name='visualizati_uuid_39d84e_idx'),
        ),
        migrations.AddIndex(
            model_name='savedgraph',
            index=models.Index(fields=['created_at'], name='visualizati_created_829ab1_idx'),
        ),
    ]
