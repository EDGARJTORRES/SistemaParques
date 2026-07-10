package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_servicio", schema = "sc_sistema")
public class Servicio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "serv_id")
    private Integer servId;

    @Column(name = "serv_nombre", length = 255)
    private String servNombre;

    @Column(name = "serv_descripcion", columnDefinition = "TEXT")
    private String servDescripcion;

    @Column(name = "serv_fecha_crea", updatable = false)
    private LocalDateTime servFechaCrea;

    @Column(name = "serv_estado", length = 1)
    private String servEstado;

    @PrePersist
    protected void onCreate() {
        if (servFechaCrea == null) {
            servFechaCrea = LocalDateTime.now();
        }
        if (servEstado == null) {
            servEstado = "A";
        }
    }

    // Getters & Setters
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
