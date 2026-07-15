package com.sisParques.dto;

public class ObreroDTO {
    private Integer obrId;
    private Integer persId;
    private String  obrEstado;

    // datos de persona (join)
    private String  persDni;
    private String  persNombre;
    private String  persApelPat;
    private String  persApelMat;
    private String  persCelu01;
    private String  nombreCompleto;

    // Getters & Setters
    public Integer getObrId()                    { return obrId; }
    public void    setObrId(Integer v)           { this.obrId = v; }

    public Integer getPersId()                   { return persId; }
    public void    setPersId(Integer v)          { this.persId = v; }

    public String  getObrEstado()                { return obrEstado; }
    public void    setObrEstado(String v)        { this.obrEstado = v; }

    public String  getPersDni()                  { return persDni; }
    public void    setPersDni(String v)          { this.persDni = v; }

    public String  getPersNombre()               { return persNombre; }
    public void    setPersNombre(String v)       { this.persNombre = v; }

    public String  getPersApelPat()              { return persApelPat; }
    public void    setPersApelPat(String v)      { this.persApelPat = v; }

    public String  getPersApelMat()              { return persApelMat; }
    public void    setPersApelMat(String v)      { this.persApelMat = v; }

    public String  getPersCelu01()               { return persCelu01; }
    public void    setPersCelu01(String v)       { this.persCelu01 = v; }

    public String  getNombreCompleto()           { return nombreCompleto; }
    public void    setNombreCompleto(String v)   { this.nombreCompleto = v; }
}
