extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate rmp_serde as rmps;

use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use rmps::{Deserializer, Serializer};

#[derive(Debug, PartialEq, Deserialize, Serialize)]
struct Human {
    age: u32,
    name: String,
}

fn main() {
    let mut buf = Vec::new();
    let val = Human {
        age: 42,
        name: "John".into(),
    };

    val.serialize(&mut Serializer::new(&mut buf)).unwrap();
}