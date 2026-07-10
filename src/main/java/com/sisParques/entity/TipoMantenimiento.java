package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_tipo_mantenimiento", schema = "sc_sistema")
public class TipoMantenimiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "tima_id")
    private Integer timaId;

    @Column(name = "tima_nombre", length = 100)
    private String timaNombre;

    @Column(name = "tima_descrip", columnDefinition = "TEXT")
    private String timaDescrip;

    @Column(name = "tima_fecha_crea", updatable = false)
    private LocalDateTime timaFechaCrea;

    @Column(name = "tima_estado", length = 1)
    private String timaEstado;

    @PrePersist
    protected void onCreate() {
        if (timaFechaCrea == null) {
            timaFechaCrea = LocalDateTime.now();
        }
        if (timaEstado == null) {
            timaEstado = "A";
        }
    }

    // Getters & Setters

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