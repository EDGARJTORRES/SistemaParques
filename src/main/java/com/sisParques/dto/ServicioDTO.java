package com.sisParques.dto;

import java.time.LocalDateTime;

public class ServicioDTO {

    private Integer servId;
    private String servNombre;
    private String servDescripcion;
    private LocalDateTime servFechaCrea;
    private String servEstado;

    public Integer getServId() { return servId; }
    public void setServId(Integer servId) { this.servId = servId; }

    public String getServNombre() { return servNombre; }
    public void setServNombre(String servNombre) { this.servNombre = servNombre; }

    public String getServDescripcion() { return servDescripcion; }
    public void setServDescripcion(String servDescripcion) { this.servDescripcion = servDescripcion; }

    public LocalDateTime getServFechaCrea() { return servFechaCrea; }
    public void setServFechaCrea(LocalDateTime servFechaCrea) { this.servFechaCrea = servFechaCrea; }

    public String getServEstado() { return servEstado; }
    public void setServEstado(String servEstado) { this.servEstado = servEstado; }
}
