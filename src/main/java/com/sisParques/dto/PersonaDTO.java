package com.sisParques.dto;

public class PersonaDTO {
    private Long   persId;
    private String persDni;
    private String persNombre;
    private String persApelPat;
    private String persApelMat;
    private String persCelu01;
    private String persEstado;
    private String nombreCompleto;

    // Getters & Setters
    public Long   getPersId()                    { return persId; }
    public void   setPersId(Long v)              { this.persId = v; }

    public String getPersDni()                   { return persDni; }
    public void   setPersDni(String v)           { this.persDni = v; }

    public String getPersNombre()                { return persNombre; }
    public void   setPersNombre(String v)        { this.persNombre = v; }

    public String getPersApelPat()               { return persApelPat; }
    public void   setPersApelPat(String v)       { this.persApelPat = v; }

    public String getPersApelMat()               { return persApelMat; }
    public void   setPersApelMat(String v)       { this.persApelMat = v; }

    public String getPersCelu01()                { return persCelu01; }
    public void   setPersCelu01(String v)        { this.persCelu01 = v; }

    public String getPersEstado()                { return persEstado; }
    public void   setPersEstado(String v)        { this.persEstado = v; }

    public String getNombreCompleto()            { return nombreCompleto; }
    public void   setNombreCompleto(String v)    { this.nombreCompleto = v; }
}
