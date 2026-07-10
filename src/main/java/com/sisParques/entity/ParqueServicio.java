package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "tb_parque_servicio",
    schema = "sc_sistema",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"parq_id", "serv_id"})
    }
)
public class ParqueServicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "pase_id")
    private Integer paseId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parq_id", nullable = false)
    private Parque parque;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serv_id", nullable = false)
    private Servicio servicio;

    @Column(name = "pase_fecha_crea", updatable = false)
    private LocalDateTime paseFechaCrea;

    @Column(name = "pase_estado", length = 1)
    private String paseEstado;

    @PrePersist
    protected void onCreate() {
        if (paseFechaCrea == null) {
            paseFechaCrea = LocalDateTime.now();
        }

        if (paseEstado == null) {
            paseEstado = "A";
        }
    }

    public Integer getPaseId() {
        return paseId;
    }

    public void setPaseId(Integer paseId) {
        this.paseId = paseId;
    }

    public Parque getParque() {
        return parque;
    }

    public void setParque(Parque parque) {
        this.parque = parque;
    }

    public Servicio getServicio() {
        return servicio;
    }

    public void setServicio(Servicio servicio) {
        this.servicio = servicio;
    }

    public LocalDateTime getPaseFechaCrea() {
        return paseFechaCrea;
    }

    public void setPaseFechaCrea(LocalDateTime paseFechaCrea) {
        this.paseFechaCrea = paseFechaCrea;
    }

    public String getPaseEstado() {
        return paseEstado;
    }

    public void setPaseEstado(String paseEstado) {
        this.paseEstado = paseEstado;
    }
}