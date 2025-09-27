# app/utils/emprendedor.py
from sqlalchemy.orm import Session
from app import models

def ensure_emprendedor_for_user(db: Session, usuario_id: int) -> models.Emprendedor:
    """
    Devuelve el Emprendedor del usuario. Si no existe, lo crea con datos válidos.
    GARANTIZA: nombre nunca es NULL (usa username/email/placeholder).
    """
    e = db.query(models.Emprendedor).filter(models.Emprendedor.usuario_id == usuario_id).first()
    if e:
        return e

    # buscamos el usuario para tomar username/email como fallback
    u = db.query(models.Usuario).get(usuario_id)

    # nombre por defecto: username -> email -> "Usuario <id>"
    nombre_defecto = None
    if u:
        nombre_defecto = (u.username or u.email or f"Usuario {usuario_id}")
    else:
        nombre_defecto = f"Usuario {usuario_id}"

    # Para tolerar posibles columnas antiguas con NOT NULL, usamos "" (string vacío)
    # en apellido/negocio si querés máxima compatibilidad. Cambiá a None si seguro son NULLables.
    e = models.Emprendedor(
        usuario_id=usuario_id,
        nombre=nombre_defecto,
        apellido="",     # o None si tu DB lo permite
        negocio="",      # o None si tu DB lo permite
        descripcion=None,
        codigo_cliente=None,
    )

    db.add(e)
    db.flush()   # fuerza validaciones antes del commit
    db.commit()
    db.refresh(e)
    return e
