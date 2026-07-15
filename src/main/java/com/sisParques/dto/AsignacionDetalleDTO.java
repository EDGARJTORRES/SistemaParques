package com.sisParques.dto;

import java.time.LocalDateTime;

public class AsignacionDetalleDTO {
    private Long          asigDetId;
    private Long          asigId;
    private Long          bienId;
    private String        objNombre;
    private String        bienPlaca;
    private String        bienNumSerie;
    private LocalDateTime fechaAsignacion;
    private LocalDateTime fechaRetiro;
    private String        estado;

    public Long   getAsigDetId()                          { return asigDetId; }
    public void   setAsigDetId(Long v)                    { this.asigDetId = v; }

    public Long   getAsigId()                             { return asigId; }
    public void   setAsigId(Long v)                       { this.asigId = v; }

    public Long   getBienId()                             { return bienId; }
    public void   setBienId(Long v)                       { this.bienId = v; }

    public String getObjNombre()                          { return objNombre; }
    public void   setObjNombre(String v)                  { this.objNombre = v; }

    public String getBienPlaca()                          { return bienPlaca; }
    public void   setBienPlaca(String v)                  { this.bienPlaca = v; }

    public String getBienNumSerie()                       { return bienNumSerie; }
    public void   setBienNumSerie(String v)               { this.bienNumSerie = v; }

    public LocalDateTime getFechaAsignacion()             { return fechaAsignacion; }
    public void   setFechaAsignacion(LocalDateTime v)     { this.fechaAsignacion = v; }

    public LocalDateTime getFechaRetiro()                 { return fechaRetiro; }
    public void   setFechaRetiro(LocalDateTime v)         { this.fechaRetiro = v; }

    public String getEstado()                             { return estado; }
    public void   setEstado(String v)                     { this.estado = v; }
}
