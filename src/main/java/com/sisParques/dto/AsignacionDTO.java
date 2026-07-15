package com.sisParques.dto;

import java.time.LocalDateTime;
import java.util.List;

public class AsignacionDTO {
    private Long                       asigId;
    private Long                       obrId;
    private LocalDateTime              asigFecha;
    private String                     asigObservacion;
    private String                     asigEstado;
    private Integer                    idUsuario;

    // datos del obrero (join)
    private String                     obreroNombre;
    private String                     obreroDni;
    private String                     obreroCelular;

    // detalle de bienes
    private List<AsignacionDetalleDTO> detalles;

    // IDs de bienes para crear/actualizar
    private List<Long>                 bienIds;

    public Long   getAsigId()                              { return asigId; }
    public void   setAsigId(Long v)                        { this.asigId = v; }

    public Long   getObrId()                               { return obrId; }
    public void   setObrId(Long v)                         { this.obrId = v; }

    public LocalDateTime getAsigFecha()                    { return asigFecha; }
    public void   setAsigFecha(LocalDateTime v)            { this.asigFecha = v; }

    public String getAsigObservacion()                     { return asigObservacion; }
    public void   setAsigObservacion(String v)             { this.asigObservacion = v; }

    public String getAsigEstado()                          { return asigEstado; }
    public void   setAsigEstado(String v)                  { this.asigEstado = v; }

    public Integer getIdUsuario()                          { return idUsuario; }
    public void   setIdUsuario(Integer v)                  { this.idUsuario = v; }

    public String getObreroNombre()                        { return obreroNombre; }
    public void   setObreroNombre(String v)                { this.obreroNombre = v; }

    public String getObreroDni()                           { return obreroDni; }
    public void   setObreroDni(String v)                   { this.obreroDni = v; }

    public String getObreroCelular()                       { return obreroCelular; }
    public void   setObreroCelular(String v)               { this.obreroCelular = v; }

    public List<AsignacionDetalleDTO> getDetalles()        { return detalles; }
    public void   setDetalles(List<AsignacionDetalleDTO> v){ this.detalles = v; }

    public List<Long> getBienIds()                         { return bienIds; }
    public void   setBienIds(List<Long> v)                 { this.bienIds = v; }
}
