class PubSub {

	static subscribers = {
		// per topic
		// topic: { msgs: [], listeners: [] }
	};

	static subscribe(topic, listener, msgsToReturn = 0) {

		if (!PubSub.subscribers.topic) {
			PubSub.subscribers[topic] = { msgs: [], listeners: [] };
		}

		const { msgs, listeners } = PubSub.subscribers[topic];

		listeners.push(listener);
		
		if (msgsToReturn > 0) {
			const startIndex = msgs.length > msgsToReturn ? msgs.length - msgsToReturn : 0;
			for (let i = startIndex; i < msgs.length; i++) {
				listener(msgs[i]);
			}
		}

	}
	
	static publish(topic, msg) {

		if (!PubSub.subscribers.topic) {
			PubSub.subscribers[topic] = { msgs: [], listeners: [] };
		}

		const { msgs, listeners } = PubSub.subscribers[topic];

		msgs.push(msg);

		listeners.forEach((listener, index) => {
			listener(msg);
		});
	}

};

module.exports =  PubSub;