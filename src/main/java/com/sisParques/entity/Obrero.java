package com.sisParques.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tb_obrero", schema = "sc_sistema")
public class Obrero {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "obr_id")
    private Integer obrId;

    @Column(name = "pers_id", nullable = false)
    private Integer persId;

    @Column(name = "obr_fecha_crea", updatable = false)
    private LocalDateTime obrFechaCrea;

    @Column(name = "obr_estado", length = 1)
    private String obrEstado;

    @PrePersist
    protected void onCreate() {
        if (obrFechaCrea == null) obrFechaCrea = LocalDateTime.now();
        if (obrEstado    == null) obrEstado    = "A";
    }

    public Integer getObrId()                         { return obrId; }
    public void    setObrId(Integer obrId)            { this.obrId = obrId; }

    public Integer getPersId()                        { return persId; }
    public void    setPersId(Integer persId)          { this.persId = persId; }

    public LocalDateTime getObrFechaCrea()            { return obrFechaCrea; }
    public void setObrFechaCrea(LocalDateTime v)      { this.obrFechaCrea = v; }

    public String getObrEstado()                      { return obrEstado; }
    public void   setObrEstado(String obrEstado)      { this.obrEstado = obrEstado; }
}
