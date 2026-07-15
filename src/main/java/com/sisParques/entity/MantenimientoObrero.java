package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_mantenimiento_obrero", schema = "sc_sistema")
public class MantenimientoObrero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "mant_obr_id")
    private Integer mantObrId;

    @Column(name = "mant_id", nullable = false)
    private Integer mantId;

    @Column(name = "obr_id", nullable = false)
    private Integer obrId;

    @Column(name = "mant_obr_fecha_crea", updatable = false)
    private LocalDateTime mantObrFechaCrea;

    @Column(name = "mant_obr_estado", length = 1)
    private String mantObrEstado;

    @PrePersist
    protected void onCreate() {
        if (mantObrFechaCrea == null) mantObrFechaCrea = LocalDateTime.now();
        if (mantObrEstado    == null) mantObrEstado    = "A";
    }

    public Integer getMantObrId()                       { return mantObrId; }
    public void    setMantObrId(Integer v)              { this.mantObrId = v; }
    public Integer getMantId()                          { return mantId; }
    public void    setMantId(Integer v)                 { this.mantId = v; }
    public Integer getObrId()                           { return obrId; }
    public void    setObrId(Integer v)                  { this.obrId = v; }
    public LocalDateTime getMantObrFechaCrea()          { return mantObrFechaCrea; }
    public void    setMantObrFechaCrea(LocalDateTime v) { this.mantObrFechaCrea = v; }
    public String  getMantObrEstado()                   { return mantObrEstado; }
    public void    setMantObrEstado(String v)           { this.mantObrEstado = v; }
}
