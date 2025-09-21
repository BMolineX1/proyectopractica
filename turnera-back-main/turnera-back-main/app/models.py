from typing import Optional
from pydantic import Field
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Float, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    rol = Column(String, default="cliente")  # cliente o emprendedor

    token= Column(String, nullable=True)

    emprendedor = relationship("Emprendedor", back_populates="usuario", uselist=False)
    reservas = relationship("Reserva", back_populates="usuario")


class Emprendedor(Base):
    __tablename__ = "emprendedores"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), unique=True)
    nombre = Column(String, nullable=False)
    apellido = Column(String, nullable=False)
    negocio = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)

    usuario = relationship("Usuario", back_populates="emprendedor")
    servicios = relationship("Servicio", back_populates="emprendedor")
    codigo_cliente = Column(String, unique=True, nullable=True)


class Servicio(Base):
    __tablename__ = "servicios"

    id = Column(Integer, primary_key=True, index=True)
    emprendedor_id = Column(Integer, ForeignKey("emprendedores.id"))
    nombre = Column(String, nullable=False)
    descripcion = Column(Text, nullable=True)

    emprendedor = relationship("Emprendedor", back_populates="servicios")
    turnos = relationship("Turno", back_populates="servicio")



class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    servicio_id = Column(Integer, ForeignKey("servicios.id"))
    fecha_hora_inicio = Column(DateTime, nullable=False, default=datetime.datetime.utcnow)
    duracion_minutos = Column(Integer, nullable=False)
    capacidad = Column(Integer, nullable=False, default=1)
    precio = Column(Float, nullable=True)

    servicio = relationship("Servicio", back_populates="turnos")
    reservas = relationship("Reserva", back_populates="turno")


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    turno_id = Column(Integer, ForeignKey("turnos.id"))
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))

    turno = relationship("Turno", back_populates="reservas")
    usuario = relationship("Usuario", back_populates="reservas")

    __table_args__ = (UniqueConstraint("turno_id", "usuario_id", name="uq_turno_usuario"),)


