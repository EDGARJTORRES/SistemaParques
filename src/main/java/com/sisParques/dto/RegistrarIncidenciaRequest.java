package com.sisParques.dto;

public class RegistrarIncidenciaRequest {

    private CiudadanoDTO ciudadano;
    private IncidenciaDTO incidencia;

    public CiudadanoDTO getCiudadano() { return ciudadano; }
    public void setCiudadano(CiudadanoDTO ciudadano) { this.ciudadano = ciudadano; }

    public IncidenciaDTO getIncidencia() { return incidencia; }
    public void setIncidencia(IncidenciaDTO incidencia) { this.incidencia = incidencia; }
}