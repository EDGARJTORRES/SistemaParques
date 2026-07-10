
package com.sisParques.dto;

public class TotpSetupResponse {
    private String secret;
    private String qrDataUri;

    public TotpSetupResponse(String secret, String qrDataUri) {
        this.secret = secret;
        this.qrDataUri = qrDataUri;
    }
    public String getSecret() { return secret; }
    public String getQrDataUri() { return qrDataUri; }
}