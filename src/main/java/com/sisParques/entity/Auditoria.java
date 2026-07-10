package com.sisParques.entity;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.PrePersist;

@Entity
@Table(name = "auditoria", schema = "sc_sistema")
public class Auditoria {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_log")
    private Long idLog;

    @Column(name = "id_usuario", nullable = false)
    private Integer idUsuario;

    @Column(name = "accion", nullable = false, length = 50)
    private String accion;

    @Column(name = "modulo", nullable = false, length = 50)
    private String modulo;

    @Column(name = "detalle", nullable = false, length = 500)
    private String detalle;

    @Column(name = "fecha_hora", nullable = false)
    @JsonProperty("fecha_hora")
    private LocalDateTime fechaHora;

    // Constructors
    public Auditoria() {}

    public Auditoria(Integer idUsuario, String accion, String modulo, String detalle) {
        this.idUsuario = idUsuario;
        this.accion = accion;
        this.modulo = modulo;
        this.detalle = detalle;
    }

    // Getters and Setters
    public Long getIdLog() {
        return idLog;
    }

    public void setIdLog(Long idLog) {
        this.idLog = idLog;
    }

    public Integer getIdUsuario() {
        return idUsuario;
    }

    public void setIdUsuario(Integer idUsuario) {
        this.idUsuario = idUsuario;
    }

    public String getAccion() {
        return accion;
    }

    public void setAccion(String accion) {
        this.accion = accion;
    }

    public String getModulo() {
        return modulo;
    }

    public void setModulo(String modulo) {
        this.modulo = modulo;
    }

    public String getDetalle() {
        return detalle;
    }

    public void setDetalle(String detalle) {
        this.detalle = detalle;
    }

    public LocalDateTime getFechaHora() {
        return fechaHora;
    }

    public void setFechaHora(LocalDateTime fechaHora) {
        this.fechaHora = fechaHora;
    }

    @PrePersist
    protected void onCreate() {
        this.fechaHora = LocalDateTime.now();
    }

    @Override
    public String toString() {
        return "Auditoria{" +
                "idLog=" + idLog +
                ", idUsuario=" + idUsuario +
                ", accion='" + accion + '\'' +
                ", modulo='" + modulo + '\'' +
                ", detalle='" + detalle + '\'' +
                ", fechaHora=" + fechaHora +
                '}';
    }
}
