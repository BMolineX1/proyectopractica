from sqlalchemy import (
    Column, Integer, String, ForeignKey, DateTime, Float, Text, UniqueConstraint, Time
)
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


# =========================
# Horarios
# =========================
class Horario(Base):
    __tablename__ = "horarios"

    id = Column(Integer, primary_key=True, index=True)
    emprendedor_id = Column(Integer, ForeignKey("emprendedores.id"), nullable=False)
    dia_semana = Column(String, nullable=False)  # "Lunes", "Martes", etc.
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time, nullable=False)

    emprendedor = relationship("Emprendedor", back_populates="horarios")


# =========================
# Usuario
# =========================
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=True)
    apellido = Column(String, nullable=True)
    dni = Column(String, nullable=True, unique=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    rol = Column(String, default="cliente")  # "cliente" o "emprendedor"

    token = Column(String, nullable=True)

    emprendedor = relationship("Emprendedor", back_populates="usuario", uselist=False)
    reservas = relationship("Reserva", back_populates="usuario")


# =========================
# Emprendedor
# =========================
class Emprendedor(Base):
    __tablename__ = "emprendedores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True, nullable=False)

    # Datos del comercio (compatibilidad: pueden ser NULL en DB antigua)
    negocio = Column(String, nullable=True)
    descripcion = Column(Text, nullable=True)
    rubro = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    instagram = Column(String, nullable=True)
    web = Column(String, nullable=True)
    email_contacto = Column(String, nullable=True)
    cuit = Column(String, nullable=True)
    foto_url = Column(String, nullable=True)

    # Código público único para reservar por código
    codigo_cliente = Column(String, unique=True, index=True, nullable=True)

    # Relaciones
    usuario = relationship("Usuario", back_populates="emprendedor")
    servicios = relationship(
        "Servicio", back_populates="emprendedor", cascade="all, delete-orphan"
    )
    horarios = relationship(
        "Horario", back_populates="emprendedor", cascade="all, delete-orphan"
    )


# =========================
# Servicio
# =========================
class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)

    # Usado por el front
    duracion = Column(Integer, nullable=False, default=0)  # minutos
    precio = Column(Float, nullable=True, default=0)

    emprendedor_id = Column(Integer, ForeignKey("emprendedores.id"), nullable=False)

    emprendedor = relationship("Emprendedor", back_populates="servicios")
    turnos = relationship("Turno", back_populates="servicio", cascade="all, delete-orphan")


# =========================
# Turno
# =========================
class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"), nullable=False)

    fecha_hora_inicio = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    duracion_minutos = Column(Integer, nullable=False)
    capacidad = Column(Integer, nullable=False, default=1)
    precio = Column(Float, nullable=True)

    servicio = relationship("Servicio", back_populates="turnos")
    reservas = relationship("Reserva", back_populates="turno", cascade="all, delete-orphan")


# =========================
# Reserva
# =========================
class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"), nullable=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False)

    turno = relationship("Turno", back_populates="reservas")
    usuario = relationship("Usuario", back_populates="reservas")

    __table_args__ = (
        UniqueConstraint("turno_id", "usuario_id", name="uq_turno_usuario"),
    )
