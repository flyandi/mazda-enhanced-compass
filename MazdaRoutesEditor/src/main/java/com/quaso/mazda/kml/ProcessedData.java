package com.quaso.mazda.kml;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

class ProcessedData {
	private final Map<String, Set<AlertData>> data = new HashMap<>();

	public void merge(ProcessedData other) {
		for(Entry<String, Set<AlertData>> temp:other.data.entrySet()){
			if(!data.containsKey(temp.getKey())){
				data.put(temp.getKey(), temp.getValue());
			}
			data.get(temp.getKey()).addAll(temp.getValue());
		}
	}

	public Map<String, Set<AlertData>> getData() {
		return data;
	}

	public void add(String category, AlertData alertData) {
		if(!data.containsKey(category)){
			data.put(category, new HashSet<AlertData>());
		}
		data.get(category).add(alertData);		
	}

}