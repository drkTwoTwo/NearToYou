# Generated by Django 4.2.19 on 2025-03-20 04:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tracking', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='bus',
            name='icon',
            field=models.ImageField(blank=True, default='icons/default-bus.png', null=True, upload_to='icons/'),
        ),
    ]
