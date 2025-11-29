from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["username", "email", "first_name", "last_name", "institution", "password"]

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email is already registered !")
        return value
    
    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already taken !")
    
        return value
    
    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username","email", "first_name", "last_name", "institution"]
    
