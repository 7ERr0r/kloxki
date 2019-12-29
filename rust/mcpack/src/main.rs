extern crate serde;
#[macro_use]
extern crate serde_derive;
extern crate rmp_serde as rmps;


use std::io::Write;
use std::path::Path;

use std::env;
use std::fs;

use std::error::Error;

use std::collections::HashMap;
use serde::{Serialize};
use rmps::{Serializer};
use serde_json::{Value};

#[macro_use] extern crate lazy_static;


#[derive(Debug, PartialEq, Deserialize, Serialize)]
struct Human {
    age: u32,
    name: String,
}
#[derive(Serialize, Deserialize)]
struct Asset {
    hash: String,
    
}
#[derive(Serialize, Deserialize)]
struct AssetIndex {
    objects: HashMap<String, Asset>,
}
#[derive(Serialize, Deserialize)]
struct BlockModel {
    textures: HashMap<String, String>,
    parent: String,
}

#[allow(dead_code)]
fn load_dynamic(contents: &str) -> serde_json::Result<Value> {
    let v: Value = serde_json::from_str(contents)?;
    Ok(v)
}
#[allow(dead_code)]
fn load_asset_index(contents: &str) -> serde_json::Result<AssetIndex> {
    let v: AssetIndex = serde_json::from_str(contents)?;
    Ok(v)
}
#[allow(dead_code)]
fn load_block_model(contents: &str) -> serde_json::Result<BlockModel> {
    Ok(serde_json::from_str(contents)?)
}

fn read_zip(buf: Vec<u8>, cb: &mut dyn FnMut(zip::read::ZipFile<'_>) -> Result<()>) -> Result<()>
{
    let reader = std::io::Cursor::new(buf);

    let mut zip = zip::ZipArchive::new(reader)?;

    for i in 0..zip.len()
    {
        let file = zip.by_index(i)?;
        cb(file)?;
    }
    Ok(())
}

fn main(){
    let res = run();
    match res {
        Ok(_) => {},
        Err(e) => println!("run error: {}", e),
    }
}

fn shrink(val: &mut serde_json::Value) -> &mut serde_json::Value {
    match val {
        serde_json::Value::Object(obj) => {
            match obj.entry("__comment") {
                serde_json::map::Entry::Occupied(occupied) => {
                    println!("removing {}", occupied.get());
                    occupied.remove();
                }
                serde_json::map::Entry::Vacant(_) => {},
            }
            for (_, mut val) in obj.iter_mut() {
                shrink(&mut val);
            }
        },
        serde_json::Value::Array(arr) => {
            for val in arr.into_iter() {
                shrink(val);
            }
        }
        _ => {}
    }
    val
}

fn run() -> Result<()> {


    let mc_version = "1.15.1";
    let appdata_str = env::var("appdata")?;
    let appdata_path = Path::new(&appdata_str);
    let minecraft_path = appdata_path.join(Path::new(".minecraft"));
    let assets_path = minecraft_path.join(Path::new("versions"));
    let indexes_path = assets_path.join(Path::new(mc_version));
    let jar_path = indexes_path.join(Path::new(format!("{}.jar", mc_version).as_str()));
    let path_str = jar_path.to_str().ok_or(McPackError::new("path to_str :/".to_string()))?;
    println!("jar_path: {}", path_str);

    

    let mut models = serde_json::map::Map::new();

    let mut buffer = String::new();
    


    let contents = fs::read(path_str)?;
    read_zip(contents, &mut |mut file|{
        
        let name = file.name().to_string();
        

        if name.contains("/minecraft/models/") || name.contains("/minecraft/blockstates/") {
            //println!("Filename: {}", name);
            lazy_static! {
                static ref RE: regex::Regex = regex::Regex::new(r"/minecraft/((?:models|blockstates)/[a-zA-Z0-9_/]+)\.json$").unwrap();
            }
            let captures = RE.captures(name.as_str()).ok_or_else(|| McPackError::new(format!("regex didn't match for {}", name)))?;
            let matched = captures.get(1).ok_or_else(|| McPackError::new(format!("regex didn't match 1st group for {}", name)))?;
            let model_name = matched.as_str();
            buffer.clear();
            use std::io::Read;

            file.read_to_string(&mut buffer)?;
            let model = load_dynamic(buffer.as_str())?;
            
        
            models.insert(model_name.to_string(), model);

        }
        Ok(())
    })?;

    match shrink(&mut serde_json::Value::Object(models)){
        serde_json::Value::Object(models) => {
            let msgpack_buf = {
                let mut buf = Vec::new();
                models.serialize(&mut Serializer::new(&mut buf))?;
                buf
            };
            {
                let out_name = "jsons.msgpack";
                let mut file = std::fs::File::create(out_name)?;
                file.write_all(msgpack_buf.as_slice())?;
                println!("created file {}", out_name);
            }
            let zlib_buf = {
                let mut buf = Vec::new();
                let mut options: zopfli::Options = Default::default();
                options.verbose = true;
                zopfli::compress(
                    &options,
                    &zopfli::Format::Zlib, 
                    &msgpack_buf, 
                    &mut buf
                )?;
                buf
            };

            {
                let out_name = "jsons.msgpack.zlib";
                let mut file = std::fs::File::create(out_name)?;
                file.write_all(zlib_buf.as_slice())?;
                println!("created file {}", out_name);
            }
        
        },
        _ => {}
    }

    
    Ok(())
}




// Change the alias to `Box<error::Error>`.
type Result<T> = std::result::Result<T, Box<dyn std::error::Error>>;

#[allow(dead_code)]
fn mc_err(details: String) -> Result<()> {
    return Err(Box::new(McPackError::new(details)));
}

#[derive(Debug)]
struct McPackError {
    details: String
}
impl McPackError {
    fn new(msg: String) -> McPackError {
        McPackError{details: msg}
    }
}

impl std::fmt::Display for McPackError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f,"{}",self.details)
    }
}

impl Error for McPackError {
    fn description(&self) -> &str {
        &self.details
    }
}
