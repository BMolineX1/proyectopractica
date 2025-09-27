from datetime import datetime, time
from typing import Optional, List

from pydantic import BaseModel, EmailStr, Field, ConfigDict


# =========================
# Horarios
# =========================
class HorarioBase(BaseModel):
    dia_semana: str
    hora_inicio: time
    hora_fin: time


class HorarioUpdate(BaseModel):
    dia_semana: str
    hora_inicio: Optional[str] = None
    hora_fin: Optional[str] = None


class HorarioCreate(HorarioBase):
    pass


class Horario(HorarioBase):
    id: int
    emprendedor_id: int
    model_config = ConfigDict(from_attributes=True)


# =========================
# Auth / JWT
# =========================
class RegisterSchema(BaseModel):
    username: str
    password: str
    email: EmailStr
    rol: str = "cliente"


class LoginSchema(BaseModel):
    username: str
    password: str


# =========================
# Usuario
# =========================
class UsuarioBase(BaseModel):
    email: EmailStr
    username: str
    rol: str = "cliente"


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioResponse(UsuarioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# =========================
# Emprendedor
# =========================
class EmprendedorBase(BaseModel):
    nombre: str
    apellido: Optional[str] = None
    negocio: Optional[str] = None
    descripcion: Optional[str] = None


class EmprendedorCreate(EmprendedorBase):
    usuario_id: int
    codigo_cliente: Optional[str] = None


class EmprendedorResponse(EmprendedorBase):
    id: int
    usuario_id: int
    codigo_cliente: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


# =========================
# Turno (para anidar en servicios)
# =========================
class TurnoResponse(BaseModel):
    id: int
    fecha_hora_inicio: datetime
    capacidad: int
    precio: Optional[float] = None
    model_config = ConfigDict(from_attributes=True)


# =========================
# Servicio
# =========================
class ServicioBase(BaseModel):
    nombre: str
    duracion: int
    precio: Optional[float] = 0
    descripcion: Optional[str] = None


class ServicioCreate(ServicioBase):
    emprendedor_id: int


class ServicioResponseCreate(ServicioBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# Respuesta “completa” con turnos (usada en /servicios/mis-servicios)
class ServicioResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str] = None
    duracion: int
    precio: Optional[float] = 0
    turnos: List[TurnoResponse] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


# =========================
# Turno (CRUD)
# =========================
class TurnoBase(BaseModel):
    fecha_hora_inicio: datetime
    duracion_minutos: int
    capacidad: int
    precio: Optional[float] = None


class TurnoCreate(TurnoBase):
    servicio_id: int


class TurnoResponseCreate(TurnoBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


# =========================
# Reserva
# =========================
class ReservaBase(BaseModel):
    turno_id: int
    usuario_id: int


class ReservaCreate(ReservaBase):
    pass


class ReservaResponse(ReservaBase):
    id: int
    model_config = ConfigDict(from_attributes=True)


class ReservaOut(BaseModel):
    id: int
    turno_id: int
    fecha_hora_inicio: datetime
    precio: Optional[float] = None
    servicio_nombre: str
    emprendedor_id: int
    model_config = ConfigDict(from_attributes=True)
