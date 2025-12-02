from tortoise import models, fields
from tortoise.fields import ReverseRelation

class User(models.Model):
    id = fields.IntField(primary_key=True)
    name = fields.CharField(max_length=150)
    email = fields.CharField(max_length=300, unique=True)
    password = fields.CharField(max_length=100, unique=True)
    services: ReverseRelation["Service"]
    
    class Meta:
        table = "Users"
        
        

class Service(models.Model):
    id = fields.IntField(primary_key=True)
    url = fields.CharField(max_length=150, unique=True)
    user = fields.ForeignKeyField("models.User",related_name="services")
    status = fields.CharField(max_length=10,default="Unknown")    
    class Meta:
        table = "Services"
        

            