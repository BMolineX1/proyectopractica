from django.contrib import admin
from .models import Usuario
from .forms import CustomUserCreationForm, CustomUserChangeForm
# Register your models here.
from django.contrib.auth.admin import UserAdmin
class CustomAdminUsuario(UserAdmin):
    model = Usuario
    list_display = ("email", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active")
    ordering = ("email",)  # ✅ ya no username
    search_fields = ("email",)

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Permissions", {"fields": ("is_staff", "is_active", "groups", "user_permissions")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "is_staff", "is_active")}
        ),
    )

admin.site.register(Usuario, CustomAdminUsuario)
class CustomAdminUsuario(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = Usuario