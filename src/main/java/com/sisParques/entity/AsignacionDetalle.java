package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_asignacion_detalle", schema = "sc_sistema")
public class AsignacionDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "asig_det_id")
    private Long asigDetId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asig_id", nullable = false)
    private Asignacion asignacion;

    @Column(name = "bien_id", nullable = false)
    private Long bienId;

    @Column(name = "fecha_asignacion")
    private LocalDateTime fechaAsignacion;

    @Column(name = "fecha_retiro")
    private LocalDateTime fechaRetiro;

    @Column(name = "estado", length = 20)
    private String estado;

    @PrePersist
    protected void onCreate() {
        if (fechaAsignacion == null) fechaAsignacion = LocalDateTime.now();
        if (estado          == null) estado          = "ASIGNADO";
    }

    public Long   getAsigDetId()                         { return asigDetId; }
    public void   setAsigDetId(Long v)                   { this.asigDetId = v; }

    public Asignacion getAsignacion()                    { return asignacion; }
    public void   setAsignacion(Asignacion a)            { this.asignacion = a; }

    public Long   getBienId()                            { return bienId; }
    public void   setBienId(Long v)                      { this.bienId = v; }

    public LocalDateTime getFechaAsignacion()            { return fechaAsignacion; }
    public void   setFechaAsignacion(LocalDateTime v)    { this.fechaAsignacion = v; }

    public LocalDateTime getFechaRetiro()                { return fechaRetiro; }
    public void   setFechaRetiro(LocalDateTime v)        { this.fechaRetiro = v; }

    public String getEstado()                            { return estado; }
    public void   setEstado(String v)                    { this.estado = v; }
}
