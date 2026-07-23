import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('cleaning', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Dataset modifications
        migrations.AlterModelOptions(
            name='dataset',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='dataset',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name='dataset',
            name='original_filename',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='dataset',
            name='download_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='dataset',
            name='is_deleted',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='dataset',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='dataset',
            name='user',
            field=models.ForeignKey(blank=True, db_index=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='datasets', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddIndex(
            model_name='dataset',
            index=models.Index(fields=['user', 'is_deleted'], name='cleaning_da_user_id_41a1bf_idx'),
        ),
        migrations.AddIndex(
            model_name='dataset',
            index=models.Index(fields=['uuid'], name='cleaning_da_uuid_2674e1_idx'),
        ),
        migrations.AddIndex(
            model_name='dataset',
            index=models.Index(fields=['created_at'], name='cleaning_da_created_273187_idx'),
        ),

        # CleaningJob modifications
        migrations.AlterModelOptions(
            name='cleaningjob',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='rows_removed',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='cols_removed',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='missing_filled',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='is_deleted',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='deleted_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='cleaningjob',
            name='updated_at',
            field=models.DateTimeField(auto_now=True),
        ),
        migrations.AlterField(
            model_name='cleaningjob',
            name='user',
            field=models.ForeignKey(blank=True, db_index=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='cleaning_jobs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddIndex(
            model_name='cleaningjob',
            index=models.Index(fields=['user', 'is_deleted'], name='cleaning_cl_user_id_4db77c_idx'),
        ),
        migrations.AddIndex(
            model_name='cleaningjob',
            index=models.Index(fields=['uuid'], name='cleaning_cl_uuid_4e4776_idx'),
        ),
        migrations.AddIndex(
            model_name='cleaningjob',
            index=models.Index(fields=['created_at'], name='cleaning_cl_created_a2eeb0_idx'),
        ),
    ]
