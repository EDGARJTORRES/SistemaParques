package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_parque", schema = "sc_sistema")
public class Parque {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "parq_id")
    private Integer parqId;

    @Column(name = "parq_nombre", length = 100)
    private String parqNombre;

    @Column(name = "parq_direccion", columnDefinition = "TEXT")
    private String parqDireccion;

    @Column(name = "parq_coordenadas", length = 100)
    private String parqCoordenadas;

    @Column(name = "parq_fecha_crea", updatable = false)
    private LocalDateTime parqFechaCrea;

    @Column(name = "parq_estado", length = 1)
    private String parqEstado;

    @PrePersist
    protected void onCreate() {
        if (parqFechaCrea == null) parqFechaCrea = LocalDateTime.now();
        if (parqEstado == null)    parqEstado    = "A";
    }

    // ── Getters & Setters ────────────────────────────────────────────────────

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
