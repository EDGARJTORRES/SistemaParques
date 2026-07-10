package com.sisParques.dto;

import java.time.LocalDateTime;

public class IncidenciaDTO {

    private Integer inciId;
    private Integer ciudId;
    private String ciudNombreCompleto;
    private String inciTitulo;
    private String inciDescripcion;
    private String inciDireccion;
    private String inciReferencia;
    private String inciEstado;
    private String inciPrioridad;
    private String inciObservacion;
    private LocalDateTime inciFechCrea;
    private Integer idUsuario;

    public Integer getInciId() { return inciId; }
    public void setInciId(Integer inciId) { this.inciId = inciId; }

    public Integer getCiudId() { return ciudId; }
    public void setCiudId(Integer ciudId) { this.ciudId = ciudId; }

    public String getCiudNombreCompleto() { return ciudNombreCompleto; }
    public void setCiudNombreCompleto(String ciudNombreCompleto) { this.ciudNombreCompleto = ciudNombreCompleto; }

    public String getInciTitulo() { return inciTitulo; }
    public void setInciTitulo(String inciTitulo) { this.inciTitulo = inciTitulo; }

    public String getInciDescripcion() { return inciDescripcion; }
    public void setInciDescripcion(String inciDescripcion) { this.inciDescripcion = inciDescripcion; }

    public String getInciDireccion() { return inciDireccion; }
    public void setInciDireccion(String inciDireccion) { this.inciDireccion = inciDireccion; }

    public String getInciReferencia() { return inciReferencia; }
    public void setInciReferencia(String inciReferencia) { this.inciReferencia = inciReferencia; }

    public String getInciEstado() { return inciEstado; }
    public void setInciEstado(String inciEstado) { this.inciEstado = inciEstado; }

    public String getInciPrioridad() { return inciPrioridad; }
    public void setInciPrioridad(String inciPrioridad) { this.inciPrioridad = inciPrioridad; }

    public String getInciObservacion() { return inciObservacion; }
    public void setInciObservacion(String inciObservacion) { this.inciObservacion = inciObservacion; }

    public LocalDateTime getInciFechCrea() { return inciFechCrea; }
    public void setInciFechCrea(LocalDateTime inciFechCrea) { this.inciFechCrea = inciFechCrea; }

    public Integer getIdUsuario() { return idUsuario; }
    public void setIdUsuario(Integer idUsuario) { this.idUsuario = idUsuario; }
}