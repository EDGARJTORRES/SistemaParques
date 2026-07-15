package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_mant_ampliacion", schema = "sc_sistema")
public class MantAmpliacion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ampl_id")
    private Integer amplId;

    @Column(name = "mant_id", nullable = false)
    private Integer mantId;

    @Column(name = "ampl_motivo", columnDefinition = "TEXT", nullable = false)
    private String amplMotivo;

    @Column(name = "ampl_fecha_nva", nullable = false)
    private LocalDate amplFechaNva;

    @Column(name = "ampl_estado", length = 15)
    private String amplEstado = "PENDIENTE";

    @Column(name = "ampl_fecha_crea", updatable = false)
    private LocalDateTime amplFechaCrea;

    @Column(name = "ampl_usuario_id")
    private Integer amplUsuarioId;

    @Column(name = "ampl_resolucion", columnDefinition = "TEXT")
    private String amplResolucion;

    @Column(name = "ampl_fecha_res")
    private LocalDateTime amplFechaRes;

    @PrePersist
    protected void onCreate() {
        if (amplFechaCrea == null)
            amplFechaCrea = LocalDateTime.now();
        if (amplEstado == null)
            amplEstado = "PENDIENTE";
    }

    // ── Getters & Setters ─────────────────────────────────────────────────────
    public Integer getAmplId() {
        return amplId;
    }

    public void setAmplId(Integer v) {
        this.amplId = v;
    }

    public Integer getMantId() {
        return mantId;
    }

    public void setMantId(Integer v) {
        this.mantId = v;
    }

    public String getAmplMotivo() {
        return amplMotivo;
    }

    public void setAmplMotivo(String v) {
        this.amplMotivo = v;
    }

    public LocalDate getAmplFechaNva() {
        return amplFechaNva;
    }

    public void setAmplFechaNva(LocalDate v) {
        this.amplFechaNva = v;
    }

    public String getAmplEstado() {
        return amplEstado;
    }

    public void setAmplEstado(String v) {
        this.amplEstado = v;
    }

    public LocalDateTime getAmplFechaCrea() {
        return amplFechaCrea;
    }

    public void setAmplFechaCrea(LocalDateTime v) {
        this.amplFechaCrea = v;
    }

    public Integer getAmplUsuarioId() {
        return amplUsuarioId;
    }

    public void setAmplUsuarioId(Integer v) {
        this.amplUsuarioId = v;
    }

    public String getAmplResolucion() {
        return amplResolucion;
    }

    public void setAmplResolucion(String v) {
        this.amplResolucion = v;
    }

    public LocalDateTime getAmplFechaRes() {
        return amplFechaRes;
    }

    public void setAmplFechaRes(LocalDateTime v) {
        this.amplFechaRes = v;
    }
}
