package com.quaso.mazda.json;

import java.io.Serializable;

@SuppressWarnings("serial")
public class EmailData implements Serializable {
	private String email;
	private String uuid;

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getUuid() {
		return uuid;
	}

	public void setUuid(String uuid) {
		this.uuid = uuid;
	}
}
