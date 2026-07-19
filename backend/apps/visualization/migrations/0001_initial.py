from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('cleaning', '0001_initial'),
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='SavedGraph',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(default='Untitled Graph', max_length=255)),
                ('chart_config', models.JSONField(default=dict)),
                ('thumbnail', models.TextField(blank=True, default='')),
                ('is_favorite', models.BooleanField(default=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('dataset', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saved_graphs',
                    to='cleaning.dataset'
                )),
                ('user', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='saved_graphs',
                    to='accounts.user'
                )),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
