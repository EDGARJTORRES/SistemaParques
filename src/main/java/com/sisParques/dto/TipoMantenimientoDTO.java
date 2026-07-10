package com.sisParques.dto;

import java.time.LocalDateTime;

public class TipoMantenimientoDTO {

    private Integer timaId;
    private String timaNombre;
    private String timaDescrip;
    private LocalDateTime timaFechaCrea;
    private String timaEstado;

    public Integer getTimaId() {
        return timaId;
    }

    public void setTimaId(Integer timaId) {
        this.timaId = timaId;
    }

    public String getTimaNombre() {
        return timaNombre;
    }

    public void setTimaNombre(String timaNombre) {
        this.timaNombre = timaNombre;
    }

    public String getTimaDescrip() {
        return timaDescrip;
    }

    public void setTimaDescrip(String timaDescrip) {
        this.timaDescrip = timaDescrip;
    }

    public LocalDateTime getTimaFechaCrea() {
        return timaFechaCrea;
    }

    public void setTimaFechaCrea(LocalDateTime timaFechaCrea) {
        this.timaFechaCrea = timaFechaCrea;
    }

    public String getTimaEstado() {
        return timaEstado;
    }

    public void setTimaEstado(String timaEstado) {
        this.timaEstado = timaEstado;
    }
}