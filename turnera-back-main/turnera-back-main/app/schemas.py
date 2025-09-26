from pydantic import BaseModel, EmailStr
from datetime import datetime, time
from typing import Optional, List


from pydantic import BaseModel



#==========Agrego Fede ===============#
class HorarioBase(BaseModel):
    dia_semana: str
    hora_inicio: time
    hora_fin: time

class HorarioUpdate(BaseModel):
    dia_semana: str
    hora_inicio: str | None = None
    hora_fin: str | None = None

class HorarioCreate(HorarioBase):
    pass

class Horario(HorarioBase):
    id: int
    emprendedor_id: int

    class Config:
        orm_mode = True

# ===================== JWT =================================

class RegisterSchema(BaseModel):
    username: str
    password: str
    email: EmailStr
    rol: str = "cliente"


class LoginSchema(BaseModel):
    username: str
    password: str


__all__ = ["RegisterSchema", "LoginSchema"]


# ---------- Usuario ----------
class UsuarioBase(BaseModel):
    email: EmailStr
    rol: str = "cliente"


class UsuarioCreate(UsuarioBase):
    password: str


class UsuarioResponse(UsuarioBase):
    id: int

    class Config:
        from_attributes = True


# ---------- Emprendedor ----------
class EmprendedorBase(BaseModel):
    nombre: str
    apellido: str
    negocio: str
    descripcion: Optional[str] = None


class EmprendedorCreate(EmprendedorBase):
    usuario_id: int
    codigo_cliente: Optional[str] = None


class EmprendedorResponse(EmprendedorBase):
    id: int
    usuario: UsuarioResponse

    class Config:
        orm_mode = True


# ---------- Servicio ----------
class ServicioBase(BaseModel):
    nombre: str
    descripcion: Optional[str] = None


class ServicioCreate(ServicioBase):
    emprendedor_id: int


class ServicioResponseCreate(ServicioBase):
    id: int

    class Config:
        orm_mode = True


# ---------- Turno ----------
class TurnoBase(BaseModel):
    fecha_hora_inicio: datetime
    duracion_minutos: int
    capacidad: int
    precio: Optional[float] = None


class TurnoCreate(TurnoBase):
    servicio_id: int


class TurnoResponseCreate(TurnoBase):
    id: int

    class Config:
        orm_mode = True


class TurnoResponse(BaseModel):
    id: int
    fecha_hora_inicio: datetime
    capacidad: int
    precio: Optional[float]

    class Config:
        orm_mode = True


class ServicioResponse(BaseModel):
    id: int
    nombre: str
    descripcion: Optional[str]
    turnos: List[TurnoResponse] = []

    class Config:
        orm_mode = True


# ---------- Reserva ----------
class ReservaBase(BaseModel):
    turno_id: int
    usuario_id: int


class ReservaCreate(ReservaBase):
    pass


class ReservaResponse(ReservaBase):
    id: int

    class Config:
        orm_mode = True


class ReservaOut(BaseModel):
    id: int
    turno_id: int
    fecha_hora_inicio: datetime
    precio: Optional[float]
    servicio_nombre: str
    emprendedor_id: int

    class Config:
        orm_mode = True