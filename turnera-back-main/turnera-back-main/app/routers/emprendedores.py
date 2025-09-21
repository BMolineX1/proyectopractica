from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app import models, schemas
from app.dependencies import get_db

router = APIRouter(prefix="/emprendedores")

@router.get("/servicios_por_codigo/{codigo}", response_model=list[schemas.ServicioResponse])
def servicios_por_codigo(codigo: str, db: Session = Depends(get_db)):
    emprendedor = db.query(models.Emprendedor).filter(models.Emprendedor.codigo_cliente == codigo).first()
    if not emprendedor:
        raise HTTPException(status_code=404, detail="Código inválido")
    
    return db.query(models.Servicio).filter(models.Servicio.emprendedor_id == emprendedor.id).all()