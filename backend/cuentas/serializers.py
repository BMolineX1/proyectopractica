from .models import Usuario
from rest_framework import serializers
from django.contrib.auth import authenticate

class CustomUsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = ('id', 'email')

class RegisterUsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Usuario
        fields = ('id', 'email', 'password',)
        extra_kwargs = {"password": {"write_only": True}}

    def validate(self, data):
        if data['password'] != data['password']:
            raise serializers.ValidationError("Las contraseñas no coinciden.")
        password1 = data.get('password')
        if len(password1) < 8:
            raise serializers.ValidationError("La contraseña debe tener al menos 8 caracteres.")  
        return data  
    def create(self, validated_data):
        password = validated_data.pop('password')
        return Usuario.objects.create_user(password=password, **validated_data)

class UsuarioLoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        email = data.get('email')
        password = data.get('password')

        if email and password:
            user = authenticate(**data)
            if user and user.is_active:
                return user
            raise serializers.ValidationError("Credenciales incorrectas.")
        