package com.sisParques.dto;

import java.time.LocalDateTime;

public class ParqueDTO {

    private Integer parqId;
    private String parqNombre;
    private String parqDireccion;
    private String parqCoordenadas;
    private LocalDateTime parqFechaCrea;
    private String parqEstado;

    public Integer getParqId() { return parqId; }
    public void setParqId(Integer parqId) { this.parqId = parqId; }

    public String getParqNombre() { return parqNombre; }
    public void setParqNombre(String parqNombre) { this.parqNombre = parqNombre; }

    public String getParqDireccion() { return parqDireccion; }
    public void setParqDireccion(String parqDireccion) { this.parqDireccion = parqDireccion; }

    public String getParqCoordenadas() { return parqCoordenadas; }
    public void setParqCoordenadas(String parqCoordenadas) { this.parqCoordenadas = parqCoordenadas; }

    public LocalDateTime getParqFechaCrea() { return parqFechaCrea; }
    public void setParqFechaCrea(LocalDateTime parqFechaCrea) { this.parqFechaCrea = parqFechaCrea; }

    public String getParqEstado() { return parqEstado; }
    public void setParqEstado(String parqEstado) { this.parqEstado = parqEstado; }
}
