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
    service_name = fields.CharField(max_length=200)
    url = fields.CharField(max_length=150, unique=True)
    user = fields.ForeignKeyField("models.User",related_name="services")
    status = fields.CharField(max_length=10,default="Unknown")    
    metrics: ReverseRelation["Metric"]
    
    class Meta:
        table = "Services"
        

class Metric(models.Model):
    id = fields.IntField(primary_key=True)
    metric = fields.CharField(max_length=100)
    service = fields.ForeignKeyField("models.Service", related_name="metrics") 
    class Meta:
        table = "Metrics"
            
            
            
class Alert(models.Model):
    id = fields.IntField(primary_key=True)
    alert_name = fields.CharField(max_length=200)
    endpoint = fields.CharField(max_length=150)
    