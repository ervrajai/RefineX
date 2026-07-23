import uuid
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('model_training', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='modeltrainingjob',
            options={'ordering': ['-created_at']},
        ),
        migrations.AddField(
            model_name='modeltrainingjob',
            name='uuid',
            field=models.UUIDField(db_index=True, default=uuid.uuid4, editable=False, unique=True),
        ),
        migrations.AddField(
            model_name='modeltrainingjob',
            name='download_count',
            field=models.IntegerField(default=0),
        ),
        migrations.AlterField(
            model_name='modeltrainingjob',
            name='is_deleted',
            field=models.BooleanField(db_index=True, default=False),
        ),
        migrations.AlterField(
            model_name='modeltrainingjob',
            name='user',
            field=models.ForeignKey(blank=True, db_index=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='model_training_jobs', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddIndex(
            model_name='modeltrainingjob',
            index=models.Index(fields=['user', 'is_deleted'], name='model_train_user_id_08b776_idx'),
        ),
        migrations.AddIndex(
            model_name='modeltrainingjob',
            index=models.Index(fields=['uuid'], name='model_train_uuid_4e987c_idx'),
        ),
        migrations.AddIndex(
            model_name='modeltrainingjob',
            index=models.Index(fields=['created_at'], name='model_train_created_d2a33f_idx'),
        ),
    ]
