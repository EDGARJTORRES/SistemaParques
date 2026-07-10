package com.sisParques.dto;

public class ParqueServicioDTO {

    private Integer paseId;

    private Integer parqId;
    private String parqNombre;

    private Integer servId;
    private String servNombre;

    private String paseEstado;

    public Integer getPaseId() {
        return paseId;
    }

    public void setPaseId(Integer paseId) {
        this.paseId = paseId;
    }

    public Integer getParqId() {
        return parqId;
    }

    public void setParqId(Integer parqId) {
        this.parqId = parqId;
    }

    public String getParqNombre() {
        return parqNombre;
    }

    public void setParqNombre(String parqNombre) {
        this.parqNombre = parqNombre;
    }

    public Integer getServId() {
        return servId;
    }

    public void setServId(Integer servId) {
        this.servId = servId;
    }

    public String getServNombre() {
        return servNombre;
    }

    public void setServNombre(String servNombre) {
        this.servNombre = servNombre;
    }

    public String getPaseEstado() {
        return paseEstado;
    }

    public void setPaseEstado(String paseEstado) {
        this.paseEstado = paseEstado;
    }
}